import { describe, expect, it } from "vitest";

import {
  methodSchema,
  overrideSchema,
  reviewSchema,
  settingsSchema,
} from "./validation";

const id = "11111111-1111-4111-8111-111111111111";
describe("billing validation", () => {
  it("requires received-funds verification and a real reference to approve", () => {
    const input = {
      id,
      decision: "approved",
      reason: "Verified payment",
      verifiedReference: "",
      verified: false,
    };
    expect(reviewSchema.safeParse(input).success).toBe(false);
    expect(reviewSchema.safeParse({ ...input, verified: true }).success).toBe(
      false
    );
    expect(
      reviewSchema.safeParse({
        ...input,
        verified: true,
        verifiedReference: "TX-12345",
      }).success
    ).toBe(true);
  });
  it("allows clarification without claiming funds were verified", () =>
    expect(
      reviewSchema.safeParse({
        id,
        decision: "clarification",
        reason: "Please check reference",
        verifiedReference: "",
        verified: false,
      }).success
    ).toBe(true));
  it("distinguishes inherited allowances from a zero allowance", () => {
    expect(
      overrideSchema.parse({
        userId: id,
        games: "",
        storageMiB: "0",
        expiresAt: "",
        reason: "Support adjustment",
      })
    ).toMatchObject({ games: null, storageMiB: 0, expiresAt: null });
  });
  it("rejects negative, fractional and unbounded overrides", () => {
    for (const games of ["-1", "1.5", "100001", "Infinity"])
      expect(
        overrideSchema.safeParse({
          userId: id,
          games,
          storageMiB: "",
          expiresAt: "",
          reason: "Support adjustment",
        }).success
      ).toBe(false);
  });
  it("requires publishing actual support and policy information", () =>
    expect(
      settingsSchema.safeParse({
        acceptingPayments: true,
        supportContact: "",
        reviewTime: "",
        policy: "",
        reason: "Open billing",
      }).success
    ).toBe(false));
  it("requires recipient details even with a QR", () =>
    expect(
      methodSchema.safeParse({
        id: "",
        provider: "GCash",
        recipient: "",
        account: "",
        instructions: "Scan QR",
        enabled: true,
        reason: "Add method",
      }).success
    ).toBe(false));
});
