import "server-only";

import { and, eq, inArray, ne, sql } from "drizzle-orm";

import { db } from "@/db/client";
import {
  expenses,
  playerPayments,
  sessionPlayers,
  sessions,
} from "@/db/schema";

import {
  collectFromPlayers,
  resolvedPlayerPrice,
  splitExpense,
} from "./domain";

export async function reconcileUnpaidExpenseShares(sessionId: string) {
  await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${sessionId} for update`
    );
    const [sessionExpenses, session] = await Promise.all([
      tx.select().from(expenses).where(eq(expenses.sessionId, sessionId)),
      tx.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
    ]);
    if (!sessionExpenses.length || !session) return;
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
      const payments = await tx
        .select()
        .from(playerPayments)
        .where(eq(playerPayments.expenseId, expense.id));
      const locked = payments.some(
        (payment) => payment.status === "sent" || payment.status === "confirmed"
      );
      if (locked) continue;
      if (payments.length)
        await tx
          .delete(playerPayments)
          .where(eq(playerPayments.expenseId, expense.id));
      const payingIds = collectFromPlayers(players, session.hostId);
      const shares = splitExpense(expense.totalCents, payingIds);
      if (!payingIds.length) continue;
      await tx.insert(playerPayments).values(
        payingIds.map((sessionPlayerId) => ({
          expenseId: expense.id,
          sessionPlayerId,
          amountCents: shares[sessionPlayerId],
        }))
      );
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
        playerPriceCents: resolvedPlayerPrice(
          currentPayments,
          session.playerPriceCents
        ),
        version: sql`${sessions.version} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(sessions.id, sessionId));
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
