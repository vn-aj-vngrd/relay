import "server-only";

import { and, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { expenses, playerPayments, sessionPlayers } from "@/db/schema";
import { splitExpense } from "./domain";

export async function reconcileUnpaidExpenseShares(sessionId: string) {
  await db.transaction(async (tx) => {
    const sessionExpenses = await tx.select().from(expenses).where(eq(expenses.sessionId, sessionId));
    if (!sessionExpenses.length) return;
    const players = await tx.select().from(sessionPlayers).where(and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.rsvp, "going")));
    for (const expense of sessionExpenses) {
      const payments = await tx.select().from(playerPayments).where(eq(playerPayments.expenseId, expense.id));
      const locked = payments.some((payment) => payment.status === "sent" || payment.status === "confirmed");
      if (locked) continue;
      if (payments.length) await tx.delete(playerPayments).where(eq(playerPayments.expenseId, expense.id));
      if (!players.length) continue;
      const shares = splitExpense(expense.totalCents, players.map((player) => player.id));
      await tx.insert(playerPayments).values(players.map((player) => ({ expenseId: expense.id, sessionPlayerId: player.id, amountCents: shares[player.id] })));
    }
  });
}

export async function hasLockedPaymentSplit(sessionId: string) {
  const sessionExpenses = await db.select({ id: expenses.id }).from(expenses).where(eq(expenses.sessionId, sessionId));
  if (!sessionExpenses.length) return false;
  return Boolean(await db.query.playerPayments.findFirst({ where: and(inArray(playerPayments.expenseId, sessionExpenses.map(({ id }) => id)), inArray(playerPayments.status, ["sent", "confirmed"])) }));
}
