import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ term: vi.fn(), override: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      billingTerms: { findFirst: mocks.term },
      billingOverrides: { findFirst: mocks.override },
    },
  },
}));
vi.mock("./catalog", async () => {
  const { defaultBillingPlans } = await import("./domain");
  return {
    getAdminBillingOffer: async () => ({
      catalog: defaultBillingPlans,
      acceptingPayments: false,
    }),
  };
});

import { getAccountPlanSummary } from "./account-plan";
import { defaultBillingPlans } from "./domain";

beforeEach(() => vi.resetAllMocks());

describe("account plan summary", () => {
  it("resolves the owner's hidden assignment without exposing the catalog", async () => {
    mocks.override.mockResolvedValue({
      planOverride: defaultBillingPlans.find((plan) => plan.id === "unlimited"),
      games: null,
      storageBytes: null,
      expiresAt: null,
    });
    expect(await getAccountPlanSummary("owner")).toEqual({
      name: "Unlimited",
      action: "Plan & billing",
    });
  });
  it("falls back after an assignment expires", async () => {
    mocks.override.mockResolvedValue({
      planOverride: defaultBillingPlans.find((plan) => plan.id === "unlimited"),
      games: null,
      storageBytes: null,
      expiresAt: new Date(0),
    });
    expect(await getAccountPlanSummary("owner")).toEqual({
      name: "Free",
      action: "Explore plans",
    });
  });
});
