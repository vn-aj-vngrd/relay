"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import {
  expenses,
  notifications,
  playerPayments,
  sessionPlayers,
  sessions,
} from "@/db/schema";
import { can, sessionActor } from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { assertRateLimit } from "@/lib/rate-limit";
import type { PaymentActionState } from "./actions";
import { paymentAmountSchema } from "./setup";
import { refreshPlayerPriceInTransaction } from "./sync";

export async function assignPlayerShare(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  const user = await requireUser();
  try {
    await assertRateLimit(
      { scope: "payment-management", limit: 60, windowSeconds: 60 },
      `user:${user.id}`,
      "Wait a moment before changing another payment."
    );
    const sessionId = z.uuid().parse(formData.get("sessionId"));
    const expenseId = z.uuid().parse(formData.get("expenseId"));
    const playerId = z.uuid().parse(formData.get("sessionPlayerId"));
    const amountCents = Math.round(
      paymentAmountSchema.parse(formData.get("amount")) * 100
    );
    const reason = z
      .string()
      .trim()
      .min(2)
      .max(240)
      .parse(formData.get("reason"));
    const session = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${sessionId} for update`
      );
      const current = await tx.query.sessions.findFirst({
        where: eq(sessions.id, sessionId),
      });
      const membership = await tx.query.sessionPlayers.findFirst({
        where: and(
          eq(sessionPlayers.sessionId, sessionId),
          eq(sessionPlayers.userId, user.id)
        ),
      });
      if (
        !current ||
        !can(
          sessionActor({ userId: user.id, hostId: current.hostId, membership }),
          "confirm_payment"
        )
      )
        throw new Error("Only a host or co-host can assign a share.");
      if (current.status === "cancelled")
        throw new Error("Payment changes are closed for this game.");
      const expense = await tx.query.expenses.findFirst({
        where: and(
          eq(expenses.id, expenseId),
          eq(expenses.sessionId, sessionId)
        ),
      });
      const player = await tx.query.sessionPlayers.findFirst({
        where: and(
          eq(sessionPlayers.id, playerId),
          eq(sessionPlayers.sessionId, sessionId)
        ),
      });
      if (
        !expense ||
        !player ||
        player.rsvp !== "going" ||
        player.leftAt ||
        player.userId === current.hostId
      )
        throw new Error("Choose a current Going player other than the host.");
      const existing = await tx.query.playerPayments.findFirst({
        where: and(
          eq(playerPayments.expenseId, expenseId),
          eq(playerPayments.sessionPlayerId, playerId)
        ),
      });
      if (existing)
        throw new Error(
          "This player already has a share. Edit their existing amount instead."
        );
      await tx.insert(playerPayments).values({
        expenseId,
        sessionPlayerId: playerId,
        amountCents: 0,
        amountSource: "manual",
        adjustmentReason: reason,
        pendingAdjustment:
          amountCents > 0
            ? {
                id: crypto.randomUUID(),
                amountCents,
                previousCents: 0,
                reason,
                proposedBy: user.id,
              }
            : null,
        adjustmentHistory:
          amountCents === 0
            ? [
                {
                  amountCents: 0,
                  previousCents: 0,
                  reason,
                  changedBy: user.id,
                  changedAt: new Date().toISOString(),
                  decision: "applied" as const,
                },
              ]
            : [],
      });
      await refreshPlayerPriceInTransaction(tx, sessionId);
      if (player.userId)
        await tx.insert(notifications).values({
          userId: player.userId,
          sessionId,
          type: "payment_updated",
          payload: {},
        });
      return current;
    });
    for (const path of [
      "/home",
      "/games",
      "/games/open",
      `/games/${session.id}`,
      `/games/${session.id}/settings`,
      `/games/${session.id}/payments`,
      `/s/${session.slug}`,
      `/s/${session.slug}/payments`,
    ])
      revalidatePath(path);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        error instanceof Error && !(error instanceof z.ZodError)
          ? error.message
          : "Choose a player, a valid amount, and a short reason.",
    };
  }
}
