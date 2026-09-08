import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import type { expenses, playerPayments } from "@/db/schema";
import { assertPaymentRevision, paymentRevision } from "./payment-revision";

const session = {
  id: "game",
  version: 1,
  status: "published",
  playerPriceCents: 30000,
};
const collections = [
  { id: "one", totalCents: 120000, archivedAt: null },
] as Array<typeof expenses.$inferSelect>;
const payments = [
  { id: "a", status: "unpaid", amountCents: 30000 },
  { id: "b", status: "unpaid", amountCents: 30000 },
] as Array<typeof playerPayments.$inferSelect>;

describe("payment confirmation revision", () => {
  it("is independent of database row order", () => {
    expect(paymentRevision(session, collections, payments)).toBe(
      paymentRevision(session, collections, [...payments].reverse())
    );
  });
  it.each([
    { status: "sent" as const },
    { proofStoragePath: "new-proof" },
    { amountCents: 40000 },
    { confirmedAt: new Date() },
  ])("invalidates confirmation after payment activity: %j", (change) => {
    const data = new FormData();
    data.set(
      "paymentRevision",
      paymentRevision(session, collections, payments)
    );
    expect(() =>
      assertPaymentRevision(data, session, {
        collections,
        payments: [{ ...payments[0], ...change }, payments[1]],
      })
    ).toThrow("Payments changed");
  });
  it("rejects a missing confirmation snapshot", () => {
    expect(() =>
      assertPaymentRevision(new FormData(), session, { collections, payments })
    ).toThrow("confirm again");
  });
});
