import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ settings: vi.fn(), method: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      billingSettings: { findFirst: mocks.settings },
      billingMethods: { findFirst: mocks.method },
    },
  },
}));

import { getBillingCatalog, getBillingOffer } from "./catalog";
import { defaultBillingPlans, publicBillingPlans } from "./domain";

beforeEach(() => vi.resetAllMocks());

describe("server-owned billing catalog", () => {
  it("never returns Unlimited or hidden offers in public payloads", async () => {
    mocks.settings.mockResolvedValue({
      planCatalog: defaultBillingPlans.map((plan) => ({
        ...plan,
        visible: plan.id !== "plus",
      })),
    });
    const offer = await getBillingOffer();
    expect(offer.catalog.map((plan) => plan.id)).toEqual(["free", "pro"]);
    expect((await getBillingCatalog()).map((plan) => plan.id)).toContain(
      "unlimited"
    );
  });
  it("defaults to Free, Plus and Pro with paid purchases coming soon", async () => {
    expect(await getBillingOffer()).toEqual({
      catalog: publicBillingPlans(defaultBillingPlans),
      acceptingPayments: false,
    });
    expect(
      defaultBillingPlans
        .filter((plan) => plan.id === "plus" || plan.id === "pro")
        .every((plan) => plan.availability === "coming_soon")
    ).toBe(true);
  });
  it("returns published prices and allowances instead of hard-coded defaults", async () => {
    const catalog = defaultBillingPlans.map((plan) => ({ ...plan, games: 9 }));
    mocks.settings.mockResolvedValue({ planCatalog: catalog });
    expect(await getBillingCatalog()).toEqual(catalog);
  });
  it("requires an enabled payment method and does not return private recipient details", async () => {
    mocks.settings.mockResolvedValue({
      acceptingPayments: true,
      supportContact: "private",
      planCatalog: defaultBillingPlans,
    });
    expect(await getBillingOffer()).toHaveProperty("acceptingPayments", false);
    mocks.method.mockResolvedValue({ id: "method" });
    expect(await getBillingOffer()).toEqual({
      catalog: publicBillingPlans(defaultBillingPlans),
      acceptingPayments: true,
    });
  });
});
