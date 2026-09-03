import "server-only";

import { and, asc, eq } from "drizzle-orm";

import { db } from "@/db/client";
import {
  expenses,
  matches,
  messages,
  playerPayments,
  sessionQueue,
} from "@/db/schema";

export type SessionOverview = {
  messageCount: number;
  play: {
    activeMatchCount: number;
    completedMatchCount: number;
    waitingCount: number;
    featuredMatch: {
      courtLabel: string;
      teamAScore: number;
      teamBScore: number;
    } | null;
  };
  payment:
    | { view: "hidden" }
    | { view: "none"; canManage: boolean }
    | { view: "host"; proofCount: number; unpaidCount: number }
    | {
        view: "player";
        amountCents: number;
        status: "unpaid" | "sent" | "confirmed" | "excluded";
        reviewRequested: boolean;
      };
};

export async function getSessionOverview(
  sessionId: string,
  viewer?: { sessionPlayerId: string; canManage: boolean }
): Promise<SessionOverview> {
  const [sessionMatches, queue, sessionExpenses, messageCount] =
    await Promise.all([
      db
        .select({
          status: matches.status,
          courtLabel: matches.courtLabel,
          teamAScore: matches.teamAScore,
          teamBScore: matches.teamBScore,
        })
        .from(matches)
        .where(eq(matches.sessionId, sessionId))
        .orderBy(asc(matches.createdAt)),
      db
        .select({ state: sessionQueue.state })
        .from(sessionQueue)
        .where(eq(sessionQueue.sessionId, sessionId)),
      db
        .select({ id: expenses.id })
        .from(expenses)
        .where(eq(expenses.sessionId, sessionId)),
      db.$count(
        messages,
        and(eq(messages.sessionId, sessionId), eq(messages.kind, "text"))
      ),
    ]);
  const activeMatches = sessionMatches.filter(
    (match) => match.status === "active"
  );
  const play = {
    activeMatchCount: activeMatches.length,
    completedMatchCount: sessionMatches.filter(
      (match) => match.status === "completed"
    ).length,
    waitingCount: queue.filter((entry) => entry.state === "waiting").length,
    featuredMatch: activeMatches[0] ?? null,
  };

  if (!viewer) return { play, messageCount, payment: { view: "hidden" } };
  if (!sessionExpenses.length)
    return {
      play,
      messageCount,
      payment: { view: "none", canManage: viewer.canManage },
    };

  const expenseIds = sessionExpenses.map(({ id }) => id);
  if (viewer.canManage) {
    const payments = await db.query.playerPayments.findMany({
      where: (payment, { inArray }) => inArray(payment.expenseId, expenseIds),
    });
    return {
      play,
      messageCount,
      payment: {
        view: "host",
        proofCount: payments.filter((payment) => payment.status === "sent")
          .length,
        unpaidCount: payments.filter((payment) => payment.status === "unpaid")
          .length,
      },
    };
  }

  const payments = await db
    .select()
    .from(playerPayments)
    .where(and(eq(playerPayments.sessionPlayerId, viewer.sessionPlayerId)));
  const ownPayments = payments.filter(
    (payment) =>
      expenseIds.includes(payment.expenseId) && payment.status !== "excluded"
  );
  if (!ownPayments.length)
    return { play, messageCount, payment: { view: "none", canManage: false } };
  const priority = { sent: 0, unpaid: 1, confirmed: 2, excluded: 3 } as const;
  const current = [...ownPayments].sort(
    (a, b) => priority[a.status] - priority[b.status]
  )[0];
  return {
    play,
    messageCount,
    payment: {
      view: "player",
      amountCents: ownPayments.reduce(
        (total, payment) => total + payment.amountCents,
        0
      ),
      status: current.status,
      reviewRequested: ownPayments.some((payment) =>
        Boolean(payment.reviewNote)
      ),
    },
  };
}
