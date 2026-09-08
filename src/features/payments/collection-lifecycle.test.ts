import { describe, expect, it } from "vitest";
import {
  archivedPaymentLabel,
  cancelPendingProposal,
  isActiveCollection,
} from "./collection-lifecycle";
import { collectionPlayerPrice } from "./domain";

describe("collection history", () => {
  it("treats existing unarchived records as active", () => {
    expect(isActiveCollection({})).toBe(true);
    expect(isActiveCollection({ archivedAt: new Date() })).toBe(false);
  });
  it("distinguishes cancelled requests, retained proof, and previous payments", () => {
    expect(archivedPaymentLabel({ status: "unpaid" })).toContain(
      "No payment due"
    );
    expect(
      archivedPaymentLabel({ status: "unpaid", proofStoragePath: "proof" })
    ).toContain("Host follow-up needed");
    expect(archivedPaymentLabel({ status: "confirmed" })).toContain(
      "Coordinate any refund"
    );
  });
  it("records cancellation of an increase without rewriting the original amount", () => {
    const result = cancelPendingProposal(
      {
        pendingAdjustment: {
          id: "proposal",
          amountCents: 40000,
          previousCents: 30000,
          reason: "Extra court",
          proposedBy: "host",
        },
        adjustmentHistory: [],
      },
      "host",
      new Date("2030-01-01")
    );
    expect(result?.pendingAdjustment).toBeNull();
    expect(result?.adjustmentHistory[0]).toMatchObject({
      decision: "cancelled",
      amountCents: 40000,
      previousCents: 30000,
    });
    expect(result).not.toHaveProperty("amountCents");
    expect(
      cancelPendingProposal(
        { pendingAdjustment: null, adjustmentHistory: [] },
        "host",
        new Date()
      )
    ).toBeNull();
  });
  it("does not advertise a consent-pending split as Free", () => {
    expect(
      collectionPlayerPrice(
        [{ contributionMode: "split", totalCents: 1000 }],
        [{ sessionPlayerId: "a", amountCents: 0 }]
      )
    ).toBeNull();
  });
});
