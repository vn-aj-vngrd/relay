import { describe, expect, it } from "vitest";

import { accountPlanAction } from "./account-plan-policy";
import { defaultBillingPlans, resolveAllowance } from "./domain";

const now = new Date("2026-06-15T00:00:00Z");
const free = resolveAllowance({ now });

describe("contextual upgrade links", () => {
  it("says Explore plans, not Upgrade, while paid plans are coming soon", () => {
    expect(accountPlanAction(free, defaultBillingPlans, false)).toBe(
      "Explore plans"
    );
  });
  it("only offers an upgrade to a visible, active improvement with payments enabled", () => {
    const active = defaultBillingPlans.map((plan) => ({
      ...plan,
      availability: "active" as const,
    }));
    expect(accountPlanAction(free, active, true)).toBe("Upgrade plan");
    expect(
      accountPlanAction(
        free,
        active.map((plan) => ({ ...plan, visible: false })),
        true
      )
    ).toBe("Plan & billing");
  });
  it("does not upsell admin-assigned Unlimited accounts", () => {
    const assigned = resolveAllowance({
      now,
      override: {
        planOverride: defaultBillingPlans.find(
          (plan) => plan.id === "unlimited"
        )!,
        games: null,
        storageBytes: null,
        expiresAt: null,
      },
    });
    expect(accountPlanAction(assigned, defaultBillingPlans, true)).toBe(
      "Plan & billing"
    );
  });
  it("does not upsell accounts whose allowances exceed all public offers", () => {
    expect(
      accountPlanAction(
        { ...free, games: 1000, storageBytes: 100 * 1024 ** 3 },
        defaultBillingPlans,
        true
      )
    ).toBe("Plan & billing");
  });
});
