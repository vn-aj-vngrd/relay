import type { playerPayments } from "@/db/schema";

export function isActiveCollection(collection: { archivedAt?: Date | null }) {
  return !collection.archivedAt;
}

export function archivedPaymentLabel(payment: {
  status: string;
  proofStoragePath?: string | null;
  sentAt?: Date | null;
  confirmedAt?: Date | null;
  reviewNote?: string | null;
}) {
  if (payment.status === "confirmed" || payment.confirmedAt)
    return "Previously paid · Coordinate any refund with the host";
  if (
    payment.status === "sent" ||
    payment.proofStoragePath ||
    payment.sentAt ||
    payment.reviewNote
  )
    return "Payment record retained · Host follow-up needed";
  return "Request cancelled · No payment due";
}

export function cancelPendingProposal(
  payment: Pick<
    typeof playerPayments.$inferSelect,
    "pendingAdjustment" | "adjustmentHistory"
  >,
  userId: string,
  now: Date
) {
  const proposal = payment.pendingAdjustment;
  return proposal
    ? {
        pendingAdjustment: null,
        adjustmentHistory: [
          ...payment.adjustmentHistory,
          {
            amountCents: proposal.amountCents,
            previousCents: proposal.previousCents,
            reason: `${proposal.reason} — cancelled when the game became Free.`,
            changedBy: userId,
            changedAt: now.toISOString(),
            decision: "cancelled" as const,
          },
        ],
        updatedAt: now,
      }
    : null;
}
