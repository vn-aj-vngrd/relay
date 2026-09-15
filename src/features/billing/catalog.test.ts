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

import {
  getBillingCatalog,
  getBillingOffer,
  getImageUploadLimits,
} from "./catalog";
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
      chatImageMaxBytes: 4 * 1024 * 1024,
      memoryImageMaxBytes: 4 * 1024 * 1024,
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
      chatImageMaxBytes: 4 * 1024 * 1024,
      memoryImageMaxBytes: 4 * 1024 * 1024,
    });
  });
});

it("upgrades standard v1 offers while preserving availability and custom offers", async () => {
  mocks.settings.mockResolvedValue({
    planCatalog: [
      {
        ...defaultBillingPlans.find((plan) => plan.id === "free"),
        version: "free-v1",
        games: 5,
        storageBytes: 100 * 1024 * 1024,
      },
      {
        ...defaultBillingPlans.find((plan) => plan.id === "plus"),
        version: "plus-v1",
        games: 12,
        storageBytes: 500 * 1024 * 1024,
        availability: "paused",
      },
      {
        ...defaultBillingPlans.find((plan) => plan.id === "pro"),
        version: "pro-custom",
        games: 200,
        storageBytes: 50 * 1024 * 1024 * 1024,
      },
    ],
  });
  const catalog = await getBillingCatalog();
  expect(catalog.find((plan) => plan.id === "free")).toMatchObject({
    version: "free-v2",
    games: 12,
    storageBytes: 250 * 1024 * 1024,
  });
  expect(catalog.find((plan) => plan.id === "plus")).toMatchObject({
    version: "plus-v2",
    games: 40,
    storageBytes: 2 * 1024 * 1024 * 1024,
    availability: "paused",
  });
  expect(catalog.find((plan) => plan.id === "pro")).toMatchObject({
    version: "pro-custom",
    games: 200,
  });
});

it("returns the saved chat limit for uploads and public pricing", async () => {
  mocks.settings.mockResolvedValue({ chatImageMaxMiB: 3 });
  expect(await getImageUploadLimits()).toEqual({
    chatImageMaxBytes: 3 * 1024 * 1024,
    memoryImageMaxBytes: 4 * 1024 * 1024,
  });
  expect(await getBillingOffer()).toHaveProperty(
    "chatImageMaxBytes",
    3 * 1024 * 1024
  );
});
