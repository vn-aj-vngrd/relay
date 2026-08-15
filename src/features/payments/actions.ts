"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { expenses, paymentAccounts, playerPayments, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { splitExpense } from "./domain";

export async function createExpense(formData: FormData) {
  const user = await requireUser();
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!session || session.hostId !== user.id) throw new Error("Only the host can request payment");
  const totalCents = Math.round(z.coerce.number().positive().parse(formData.get("total")) * 100);
  const method = z.string().trim().min(2).max(40).parse(formData.get("method"));
  const details = z.string().trim().min(2).max(300).parse(formData.get("details"));
  const label = z.string().trim().min(2).max(80).parse(formData.get("label"));
  await db.transaction(async (tx) => {
    const [account] = await tx.insert(paymentAccounts).values({ ownerId: user.id, method, label: method, details }).returning();
    const [expense] = await tx.insert(expenses).values({ sessionId, kind: "court", label, totalCents, paidById: user.id, paymentAccountId: account.id }).returning();
    const players = await tx.select().from(sessionPlayers).where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
    const shares = splitExpense(totalCents, players.map((player) => player.id));
    if (players.length) await tx.insert(playerPayments).values(players.map((player) => ({ expenseId: expense.id, sessionPlayerId: player.id, amountCents: shares[player.id] })));
  });
  revalidatePath(`/games/${sessionId}/payments`);
}

export async function markPaymentSent(formData: FormData) {
  const user = await requireUser();
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const payment = await db.select({ payment: playerPayments, player: sessionPlayers, expense: expenses }).from(playerPayments).innerJoin(sessionPlayers, eq(playerPayments.sessionPlayerId, sessionPlayers.id)).innerJoin(expenses, eq(playerPayments.expenseId, expenses.id)).where(eq(playerPayments.id, paymentId)).limit(1);
  if (!payment[0] || payment[0].player.userId !== user.id) throw new Error("You can only update your own payment");
  await db.update(playerPayments).set({ status: "sent", sentAt: new Date() }).where(eq(playerPayments.id, paymentId));
  revalidatePath(`/games/${payment[0].expense.sessionId}/payments`);
}

export async function confirmPayment(formData: FormData) {
  const user = await requireUser();
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const rows = await db.select({ payment: playerPayments, expense: expenses, session: sessions }).from(playerPayments).innerJoin(expenses, eq(playerPayments.expenseId, expenses.id)).innerJoin(sessions, eq(expenses.sessionId, sessions.id)).where(eq(playerPayments.id, paymentId)).limit(1);
  if (!rows[0] || rows[0].session.hostId !== user.id) throw new Error("Only the host can confirm payments");
  await db.update(playerPayments).set({ status: "confirmed", confirmedAt: new Date(), confirmedById: user.id }).where(eq(playerPayments.id, paymentId));
  revalidatePath(`/games/${rows[0].session.id}/payments`);
}
