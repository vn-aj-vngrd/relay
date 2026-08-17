"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { expenses, notifications, paymentAccounts, playerPayments, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { getSessionViewer } from "@/features/sessions/viewer";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { collectFromPlayers, splitExpense, validatePaymentProof } from "./domain";

export type PaymentActionState = { error?: string; success?: boolean };

export async function createExpense(formData: FormData) {
  const user = await requireUser();
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!session || session.hostId !== user.id) throw new Error("Only the host can request payment");
  const totalCents = Math.round(z.coerce.number().positive().parse(formData.get("total")) * 100);
  const method = z.string().trim().min(2).max(40).parse(formData.get("method"));
  const details = z.string().trim().min(2).max(300).parse(formData.get("details"));
  const label = z.string().trim().min(2).max(80).parse(formData.get("label"));
  const qr = formData.get("qr");
  const receipt = formData.get("receipt");
  let qrStoragePath: string | null = null;
  let receiptStoragePath: string | null = null;
  if (qr instanceof File && qr.size > 0) {
    if (!["image/jpeg", "image/png", "image/webp"].includes(qr.type) || qr.size > 5 * 1024 * 1024) throw new Error("Use a JPG, PNG, or WebP QR image under 5 MB");
    const extension = qr.type === "image/png" ? "png" : qr.type === "image/webp" ? "webp" : "jpg";
    qrStoragePath = `${user.id}/${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from("payment-qrs").upload(qrStoragePath, qr, { contentType: qr.type, upsert: false });
    if (error) throw new Error("The payment QR could not be uploaded");
  }
  if (receipt instanceof File && receipt.size > 0) {
    const receiptError = validatePaymentProof(receipt);
    if (receiptError) throw new Error(receiptError.replace("payment proof", "receipt").replace("Payment proof", "Receipt"));
    const extension = receipt.type === "image/png" ? "png" : receipt.type === "image/webp" ? "webp" : "jpg";
    receiptStoragePath = `${sessionId}/expense-${crypto.randomUUID()}.${extension}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from("booking-screenshots").upload(receiptStoragePath, receipt, { contentType: receipt.type, upsert: false });
    if (error) throw new Error("The receipt could not be uploaded");
  }
  await db.transaction(async (tx) => {
    const [account] = await tx.insert(paymentAccounts).values({ ownerId: user.id, method, label: method, details, qrStoragePath }).returning();
    const [expense] = await tx.insert(expenses).values({ sessionId, kind: "court", label, totalCents, paidById: user.id, paymentAccountId: account.id, receiptStoragePath }).returning();
    const players = await tx.select().from(sessionPlayers).where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
    const payingIds = collectFromPlayers(players, user.id);
    const shares = splitExpense(totalCents, payingIds);
    if (payingIds.length) await tx.insert(playerPayments).values(payingIds.map((sessionPlayerId) => ({ expenseId: expense.id, sessionPlayerId, amountCents: shares[sessionPlayerId] })));
    const recipients = players.filter((player) => payingIds.includes(player.id) && player.userId).map((player) => player.userId!);
    if (recipients.length) await tx.insert(notifications).values(recipients.map((userId) => ({ userId, sessionId, type: "payment_requested", payload: {} })));
  });
  revalidatePath(`/games/${sessionId}/payments`);
}

export async function markPaymentSent(_: PaymentActionState, formData: FormData): Promise<PaymentActionState> {
  const paymentId = z.uuid().safeParse(formData.get("paymentId"));
  if (!paymentId.success) return { error: "This payment could not be found." };
  const rows = await db.select({ payment: playerPayments, player: sessionPlayers, expense: expenses, session: sessions }).from(playerPayments).innerJoin(sessionPlayers, eq(playerPayments.sessionPlayerId, sessionPlayers.id)).innerJoin(expenses, eq(playerPayments.expenseId, expenses.id)).innerJoin(sessions, eq(expenses.sessionId, sessions.id)).where(eq(playerPayments.id, paymentId.data)).limit(1);
  const row = rows[0];
  if (!row) return { error: "This payment could not be found." };
  const viewer = await getSessionViewer(row.expense.sessionId, String(formData.get("slug") ?? ""));
  if (!viewer || viewer.player.id !== row.player.id) return { error: "You can only submit proof for your own payment." };
  const proof = formData.get("proof");
  if (!(proof instanceof File)) return { error: "Add one payment screenshot before submitting." };
  const proofError = validatePaymentProof(proof);
  if (proofError) return { error: proofError };

  const path = `${row.expense.sessionId}/${row.payment.id}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from("payment-proofs").upload(path, proof, { contentType: proof.type, upsert: true });
  if (error) return { error: "The proof could not be uploaded. Check your connection and try again." };

  await db.transaction(async (tx) => {
    await tx.update(playerPayments).set({ status: "sent", proofStoragePath: path, reviewNote: null, sentAt: new Date(), confirmedAt: null, confirmedById: null }).where(eq(playerPayments.id, row.payment.id));
    await tx.insert(notifications).values({ userId: row.session.hostId, sessionId: row.expense.sessionId, type: "payment_sent", payload: {} });
  });
  revalidatePath(`/games/${row.expense.sessionId}/payments`);
  const slug = formData.get("slug");
  if (typeof slug === "string" && slug) revalidatePath(`/s/${slug}/payments`);
  return { success: true };
}

export async function confirmPayment(formData: FormData) {
  const user = await requireUser();
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const rows = await db.select({ payment: playerPayments, player: sessionPlayers, session: sessions }).from(playerPayments).innerJoin(sessionPlayers, eq(playerPayments.sessionPlayerId, sessionPlayers.id)).innerJoin(expenses, eq(playerPayments.expenseId, expenses.id)).innerJoin(sessions, eq(expenses.sessionId, sessions.id)).where(eq(playerPayments.id, paymentId)).limit(1);
  const row = rows[0];
  if (!row || row.session.hostId !== user.id) throw new Error("Only the host can confirm payments");
  await db.transaction(async (tx) => {
    await tx.update(playerPayments).set({ status: "confirmed", reviewNote: null, confirmedAt: new Date(), confirmedById: user.id }).where(eq(playerPayments.id, paymentId));
    if (row.player.userId) await tx.insert(notifications).values({ userId: row.player.userId, sessionId: row.session.id, type: "payment_confirmed", payload: {} });
  });
  revalidatePath(`/games/${row.session.id}/payments`);
}

export async function updatePlayerPaymentAmount(formData: FormData) {
  const user = await requireUser();
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const amountCents = Math.round(z.coerce.number().nonnegative().parse(formData.get("amount")) * 100);
  const rows = await db.select({ player: sessionPlayers, session: sessions }).from(playerPayments).innerJoin(sessionPlayers, eq(playerPayments.sessionPlayerId, sessionPlayers.id)).innerJoin(expenses, eq(playerPayments.expenseId, expenses.id)).innerJoin(sessions, eq(expenses.sessionId, sessions.id)).where(eq(playerPayments.id, paymentId)).limit(1);
  const row = rows[0];
  if (!row || row.session.hostId !== user.id) throw new Error("Only the host can change payment amounts");
  await db.transaction(async (tx) => {
    await tx.update(playerPayments).set({ amountCents, updatedAt: new Date() }).where(eq(playerPayments.id, paymentId));
    if (row.player.userId) await tx.insert(notifications).values({ userId: row.player.userId, sessionId: row.session.id, type: "payment_updated", payload: {} });
  });
  revalidatePath(`/games/${row.session.id}/payments`);
}

export async function togglePaymentExcluded(formData: FormData) {
  const user = await requireUser();
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const rows = await db.select({ payment: playerPayments, session: sessions }).from(playerPayments).innerJoin(expenses, eq(playerPayments.expenseId, expenses.id)).innerJoin(sessions, eq(expenses.sessionId, sessions.id)).where(eq(playerPayments.id, paymentId)).limit(1);
  const row = rows[0];
  if (!row || row.session.hostId !== user.id) throw new Error("Only the host can exclude players from a split");
  if (row.payment.status === "sent" || row.payment.status === "confirmed") throw new Error("Reviewed payments cannot be excluded");
  await db.transaction(async (tx) => {
    await tx.update(playerPayments).set({ status: row.payment.status === "excluded" ? "unpaid" : "excluded", updatedAt: new Date() }).where(eq(playerPayments.id, paymentId));
    const player = await tx.query.sessionPlayers.findFirst({ where: eq(sessionPlayers.id, row.payment.sessionPlayerId) });
    if (player?.userId) await tx.insert(notifications).values({ userId: player.userId, sessionId: row.session.id, type: "payment_updated", payload: {} });
  });
  revalidatePath(`/games/${row.session.id}/payments`);
}

export async function requestNewPaymentProof(formData: FormData) {
  const user = await requireUser();
  const paymentId = z.uuid().parse(formData.get("paymentId"));
  const note = z.string().trim().min(2).max(240).parse(formData.get("note"));
  const rows = await db.select({ player: sessionPlayers, session: sessions }).from(playerPayments).innerJoin(sessionPlayers, eq(playerPayments.sessionPlayerId, sessionPlayers.id)).innerJoin(expenses, eq(playerPayments.expenseId, expenses.id)).innerJoin(sessions, eq(expenses.sessionId, sessions.id)).where(eq(playerPayments.id, paymentId)).limit(1);
  const row = rows[0];
  if (!row || row.session.hostId !== user.id) throw new Error("Only the host can review payment proof");
  await db.transaction(async (tx) => {
    await tx.update(playerPayments).set({ status: "unpaid", reviewNote: note, confirmedAt: null, confirmedById: null }).where(eq(playerPayments.id, paymentId));
    if (row.player.userId) await tx.insert(notifications).values({ userId: row.player.userId, sessionId: row.session.id, type: "payment_proof_requested", payload: { note } });
  });
  revalidatePath(`/games/${row.session.id}/payments`);
}
