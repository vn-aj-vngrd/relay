import { describe, expect, it } from "vitest";

import {
  catalogPlanSchema,
  methodSchema,
  overrideSchema,
  reviewSchema,
  settingsSchema,
} from "./validation";

const id = "11111111-1111-4111-8111-111111111111";
describe("billing validation", () => {
  it("never allows Unlimited to be published as a visible or priced offer", () => {
    const plan = {
      id: "unlimited",
      version: "unlimited-v1",
      priceCents: 0,
      games: 0,
      storageMiB: 0,
      availability: "active",
      visible: false,
    };
    expect(catalogPlanSchema.safeParse(plan).success).toBe(true);
    expect(
      catalogPlanSchema.safeParse({ ...plan, visible: true }).success
    ).toBe(false);
    expect(
      catalogPlanSchema.safeParse({ ...plan, priceCents: 1 }).success
    ).toBe(false);
  });
  it("validates published quotas as bounded explicit integers", () => {
    const plan = {
      id: "plus",
      version: "plus-v1",
      priceCents: 14900,
      games: 12,
      storageMiB: 500,
      availability: "coming_soon",
    };
    for (const games of ["", "-1", "1.5", "100001", "Infinity"]) {
      expect(catalogPlanSchema.safeParse({ ...plan, games }).success).toBe(
        false
      );
    }
    expect(
      catalogPlanSchema.parse({ ...plan, games: "0", storageMiB: "0" })
    ).toMatchObject({ games: 0, storageMiB: 0 });
    expect(
      catalogPlanSchema.safeParse({ ...plan, availability: "hidden" }).success
    ).toBe(false);
  });
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
