import "server-only";

import { createHash } from "node:crypto";
import { eq } from "drizzle-orm";
import { expenses, playerPayments } from "@/db/schema";
import type { PaymentTransaction } from "./sync";

// The browser receives only this digest, never another player's financial data.
export function paymentRevision(
  session: {
    id: string;
    version: number;
    status: string;
    playerPriceCents: number | null;
  },
  collections: Array<typeof expenses.$inferSelect>,
  payments: Array<typeof playerPayments.$inferSelect>
) {
  return createHash("sha256")
    .update(
      JSON.stringify({
        session: [
          session.id,
          session.version,
          session.status,
          session.playerPriceCents,
        ],
        collections: [...collections]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((row) => [
            row.id,
            row.updatedAt,
            row.archivedAt,
            row.totalCents,
            row.contributionMode,
            row.fixedRateCents,
            row.items,
            row.paymentAccountId,
          ]),
        payments: [...payments]
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((row) => [
            row.id,
            row.updatedAt,
            row.amountCents,
            row.status,
            row.pendingAdjustment,
            row.proofStoragePath,
            row.sentAt,
            row.confirmedAt,
            row.reviewNote,
          ]),
      })
    )
    .digest("hex");
}

// Caller holds the session lock, shared with proof/review/RSVP mutations.
export async function paymentSnapshot(
  tx: PaymentTransaction,
  sessionId: string
) {
  const collections = await tx
    .select()
    .from(expenses)
    .where(eq(expenses.sessionId, sessionId));
  const rows = await tx
    .select({ payment: playerPayments })
    .from(playerPayments)
    .innerJoin(expenses, eq(playerPayments.expenseId, expenses.id))
    .where(eq(expenses.sessionId, sessionId));
  return { collections, payments: rows.map(({ payment }) => payment) };
}

export function assertPaymentRevision(
  formData: FormData,
  session: Parameters<typeof paymentRevision>[0],
  snapshot: Awaited<ReturnType<typeof paymentSnapshot>>
) {
  if (
    formData.get("paymentRevision") !==
    paymentRevision(session, snapshot.collections, snapshot.payments)
  )
    throw new Error(
      "Payments changed since you opened settings. Reload, review the latest records, and confirm again."
    );
}
