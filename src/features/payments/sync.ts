import "server-only";

import { and, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  expenses,
  notifications,
  playerPayments,
  sessionPlayers,
  sessions,
} from "@/db/schema";

import {
  collectFromPlayers,
  disclosedPlayerTotal,
  splitExpense,
} from "./domain";

export type PaymentTransaction = Parameters<
  Parameters<typeof db.transaction>[0]
>[0];

// Caller holds the session lock. Keep payment IDs, proof, and review history.
export async function reconcileExpenseSharesInTransaction(
  tx: PaymentTransaction,
  sessionId: string,
  expenseId?: string
) {
  const [sessionExpenses, session] = await Promise.all([
    tx.select().from(expenses).where(eq(expenses.sessionId, sessionId)),
    tx.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
  ]);
  if (!sessionExpenses.length || !session || session.status === "cancelled")
    return;
  const players = await tx
    .select()
    .from(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, sessionId),
        eq(sessionPlayers.rsvp, "going")
      )
    );
  for (const expense of sessionExpenses) {
    if (expenseId && expense.id !== expenseId) continue;
    const payments = await tx
      .select()
      .from(playerPayments)
      .where(eq(playerPayments.expenseId, expense.id));
    if (
      payments.some(
        (payment) =>
          payment.status === "sent" ||
          payment.status === "confirmed" ||
          payment.proofStoragePath ||
          payment.reviewNote
      )
    )
      continue;
    const excluded = new Set(
      payments
        .filter((payment) => payment.status === "excluded")
        .map((payment) => payment.sessionPlayerId)
    );
    const payingIds = collectFromPlayers(players, session.hostId).filter(
      (id) => !excluded.has(id)
    );
    const shares = splitExpense(expense.totalCents, payingIds);
    for (const payment of payments) {
      if (payment.status === "excluded") continue;
      // Leaving the roster does not erase the financial record.
      const amountCents = shares[payment.sessionPlayerId] ?? 0;
      if (payment.amountCents === amountCents) continue;
      await tx
        .update(playerPayments)
        .set({ amountCents, updatedAt: new Date() })
        .where(eq(playerPayments.id, payment.id));
      const player = await tx.query.sessionPlayers.findFirst({
        where: eq(sessionPlayers.id, payment.sessionPlayerId),
      });
      if (player?.userId)
        await tx.insert(notifications).values({
          userId: player.userId,
          sessionId,
          type: "payment_updated",
          payload: {},
        });
    }
    const existing = new Set(
      payments.map((payment) => payment.sessionPlayerId)
    );
    const added = payingIds.filter((id) => !existing.has(id));
    if (added.length) {
      await tx.insert(playerPayments).values(
        added.map((sessionPlayerId) => ({
          expenseId: expense.id,
          sessionPlayerId,
          amountCents: shares[sessionPlayerId],
        }))
      );
      const recipients = players.filter(
        (player) => added.includes(player.id) && player.userId
      );
      if (recipients.length)
        await tx.insert(notifications).values(
          recipients.map((player) => ({
            userId: player.userId!,
            sessionId,
            type: "payment_requested",
            payload: {},
          }))
        );
    }
  }
  const currentPayments = await tx
    .select({
      sessionPlayerId: playerPayments.sessionPlayerId,
      amountCents: playerPayments.amountCents,
    })
    .from(playerPayments)
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .where(
      and(
        eq(expenses.sessionId, sessionId),
        ne(playerPayments.status, "excluded")
      )
    );
  await tx
    .update(sessions)
    .set({
      playerPriceCents: disclosedPlayerTotal(currentPayments),
      version: sql`${sessions.version} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(sessions.id, sessionId));
}

export async function reconcileUnpaidExpenseShares(sessionId: string) {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${sessionId} for update`
    );
    await reconcileExpenseSharesInTransaction(tx, sessionId);
  });
}

export async function hasLockedPaymentSplit(sessionId: string) {
  const sessionExpenses = await db
    .select({ id: expenses.id })
    .from(expenses)
    .where(eq(expenses.sessionId, sessionId));
  if (!sessionExpenses.length) return false;
  return Boolean(
    await db.query.playerPayments.findFirst({
      where: and(
        inArray(
          playerPayments.expenseId,
          sessionExpenses.map(({ id }) => id)
        ),
        inArray(playerPayments.status, ["sent", "confirmed"])
      ),
    })
  );
}
