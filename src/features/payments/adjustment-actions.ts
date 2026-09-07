"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";
import { db } from "@/db/client";
import { expenses, notifications, playerPayments, sessions } from "@/db/schema";
import { getSessionViewer } from "@/features/sessions/viewer";
import { assertRateLimit } from "@/lib/rate-limit";
import type { PaymentActionState } from "./actions";
import { hasPaymentHistory } from "./domain";
import { refreshPlayerPriceInTransaction } from "./sync";

export async function respondToPaymentAdjustment(
  _: PaymentActionState,
  formData: FormData
): Promise<PaymentActionState> {
  try {
    const paymentId = z.uuid().parse(formData.get("paymentId"));
    const proposalId = z.uuid().parse(formData.get("proposalId"));
    const decision = z
      .enum(["accept", "decline"])
      .parse(formData.get("decision"));
    const [row] = await db
      .select({ payment: playerPayments, session: sessions })
      .from(playerPayments)
      .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
      .innerJoin(sessions, eq(expenses.sessionId, sessions.id))
      .where(eq(playerPayments.id, paymentId));
    if (!row) return { error: "This payment could not be found." };
    const viewer = await getSessionViewer(row.session.id, row.session.slug);
    if (!viewer || viewer.player.id !== row.payment.sessionPlayerId)
      return { error: "Only this player can respond to the amount change." };
    await assertRateLimit(
      { scope: "payment-adjustment-response", limit: 30, windowSeconds: 60 },
      `player:${viewer.player.id}`,
      "Wait a moment before responding again."
    );
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${row.session.id} for update`
      );
      const session = await tx.query.sessions.findFirst({
        where: eq(sessions.id, row.session.id),
      });
      const payment = await tx.query.playerPayments.findFirst({
        where: and(
          eq(playerPayments.id, paymentId),
          eq(playerPayments.sessionPlayerId, viewer.player.id)
        ),
      });
      const proposal = payment?.pendingAdjustment;
      if (
        !session ||
        session.status === "cancelled" ||
        !payment ||
        !proposal ||
        proposal.id !== proposalId ||
        payment.amountCents !== proposal.previousCents ||
        hasPaymentHistory(payment) ||
        payment.status === "excluded"
      )
        throw new Error(
          "This proposal is no longer available. Reload your payments."
        );
      await tx
        .update(playerPayments)
        .set({
          amountCents:
            decision === "accept" ? proposal.amountCents : payment.amountCents,
          amountSource: "manual",
          adjustmentReason:
            decision === "accept"
              ? proposal.reason
              : `Kept current amount: ${proposal.reason}`,
          pendingAdjustment: null,
          adjustmentHistory: [
            ...payment.adjustmentHistory,
            {
              amountCents: proposal.amountCents,
              previousCents: proposal.previousCents,
              reason: proposal.reason,
              changedBy: viewer.player.id,
              changedAt: new Date().toISOString(),
              decision:
                decision === "accept"
                  ? ("accepted" as const)
                  : ("declined" as const),
            },
          ],
          updatedAt: new Date(),
        })
        .where(eq(playerPayments.id, paymentId));
      await refreshPlayerPriceInTransaction(tx, row.session.id);
      await tx.insert(notifications).values({
        userId: session.hostId,
        sessionId: session.id,
        type: "payment_updated",
        payload: {},
      });
    });
    for (const path of [
      "/home",
      "/games",
      "/games/open",
      `/games/${row.session.id}`,
      `/games/${row.session.id}/payments`,
      `/games/${row.session.id}/settings`,
      `/s/${row.session.slug}`,
      `/s/${row.session.slug}/payments`,
    ])
      revalidatePath(path);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        error instanceof Error && !(error instanceof z.ZodError)
          ? error.message
          : "The response could not be saved.",
    };
  }
}
