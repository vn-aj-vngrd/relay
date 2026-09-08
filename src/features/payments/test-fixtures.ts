import type { expenses, playerPayments } from "@/db/schema";

export function expenseFixture(
  overrides: Partial<typeof expenses.$inferSelect> = {}
): typeof expenses.$inferSelect {
  return {
    id: "expense",
    sessionId: "game",
    label: "Court",
    kind: "court",
    totalCents: 120000,
    contributionMode: "split",
    fixedRateCents: null,
    consentBefore: null,
    archivedAt: null,
    archivedById: null,
    items: [],
    paidById: "host",
    paymentAccountId: null,
    receiptStoragePath: null,
    createdAt: new Date("2030-01-01"),
    updatedAt: new Date("2030-01-01"),
    ...overrides,
  };
}

export function paymentFixture(
  overrides: Partial<typeof playerPayments.$inferSelect> = {}
): typeof playerPayments.$inferSelect {
  return {
    id: "payment",
    expenseId: "expense",
    sessionPlayerId: "player",
    amountCents: 30000,
    amountSource: "automatic",
    adjustmentReason: null,
    pendingAdjustment: null,
    adjustmentHistory: [],
    status: "unpaid",
    sentAt: null,
    proofStoragePath: null,
    reviewNote: null,
    confirmedAt: null,
    confirmedById: null,
    createdAt: new Date("2030-01-01"),
    updatedAt: new Date("2030-01-01"),
    ...overrides,
  };
}
