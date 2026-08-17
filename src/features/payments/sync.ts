import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses, playerPayments, sessionPlayers, sessions } from "@/db/schema";
import { collectFromPlayers, splitExpense } from "./domain";

export async function reconcileUnpaidExpenseShares(sessionId: string) {
  await db.transaction(async (tx) => {
    const [sessionExpenses, session] = await Promise.all([tx.select().from(expenses).where(eq(expenses.sessionId, sessionId)), tx.query.sessions.findFirst({ where: eq(sessions.id, sessionId) })]);
    if (!sessionExpenses.length || !session) return;
    const players = await tx.select().from(sessionPlayers).where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
    for (const expense of sessionExpenses) {
      const payments = await tx.select().from(playerPayments).where(eq(playerPayments.expenseId, expense.id));
      const locked = payments.some((payment) => payment.status === "sent" || payment.status === "confirmed");
      if (locked) continue;
      if (payments.length) await tx.delete(playerPayments).where(eq(playerPayments.expenseId, expense.id));
      const payingIds = collectFromPlayers(players, session.hostId);
      if (!payingIds.length) continue;
      const shares = splitExpense(expense.totalCents, payingIds);
      await tx.insert(playerPayments).values(payingIds.map((sessionPlayerId) => ({ expenseId: expense.id, sessionPlayerId, amountCents: shares[sessionPlayerId] })));
    }
  });
}

export async function hasLockedPaymentSplit(sessionId: string) {
  const sessionExpenses = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.sessionId, sessionId));
  if (!sessionExpenses.length) return false;
  return Boolean(await db.query.playerPayments.findFirst({ where: and(inArray(playerPayments.expenseId, sessionExpenses.map(({ id }) => id)), inArray(playerPayments.status, ["sent", "confirmed"])) }));
}
