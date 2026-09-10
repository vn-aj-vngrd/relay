import { render, screen } from "@testing-library/react";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  usage: vi.fn(),
  settings: vi.fn(),
  methods: vi.fn(),
  requests: vi.fn(),
  open: vi.fn(),
  terms: vi.fn(),
  assignment: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/features/billing/usage", () => ({ getAccountUsage: mocks.usage }));
vi.mock("@/features/billing/forms", () => ({
  UpgradeForm: () => (
    <div data-testid="upgrade-form">Selected plan payment</div>
  ),
}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      billingSettings: { findFirst: mocks.settings },
      billingMethods: { findMany: mocks.methods },
      billingRequests: { findMany: mocks.requests, findFirst: mocks.open },
      billingTerms: { findMany: mocks.terms },
      billingOverrides: { findFirst: mocks.assignment },
    },
  },
}));

import { parseAdminCursor } from "@/features/admin/cursor";
import { AccountBilling } from "./account-billing";
import { defaultBillingPlans, resolveAllowance } from "./domain";

const now = new Date();
const baseUsage = {
  ...resolveAllowance({ now }),
  gamesUsed: 2,
  bytesUsed: 0,
  term: null,
  override: null,
  paidThrough: null,
};

beforeEach(() => {
  vi.resetAllMocks();
  mocks.user.mockResolvedValue({ id: "account-owner" });
  mocks.usage.mockResolvedValue(baseUsage);
  mocks.settings.mockResolvedValue(null);
  mocks.methods.mockResolvedValue([]);
  mocks.requests.mockResolvedValue([]);
  mocks.open.mockResolvedValue(null);
  mocks.terms.mockResolvedValue([]);
  mocks.assignment.mockResolvedValue(null);
});

async function show(query = {}) {
  render(await AccountBilling({ searchParams: Promise.resolve(query) }));
}

function enablePurchases() {
  mocks.settings.mockResolvedValue({
    acceptingPayments: true,
    planCatalog: defaultBillingPlans.map((plan) => ({
      ...plan,
      availability: "active",
    })),
  });
  mocks.methods.mockResolvedValue([
    { id: "method", provider: "GCash", recipient: "Relay" },
  ]);
}

describe("simplified account billing", () => {
  it("shows summary cards and links to pricing instead of repeating the comparison", async () => {
    await show({ section: "plans" });
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "How plans work" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Compare all features and plan details",
      })
    ).toHaveAttribute("href", "/pricing");
    expect(
      screen.queryByRole("heading", { name: "Plan history" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("upgrade-form")).not.toBeInTheDocument();
    expect(mocks.terms).not.toHaveBeenCalled();
    expect(mocks.requests).not.toHaveBeenCalled();
  });

  it("only reveals payment setup after choosing an available plan", async () => {
    enablePurchases();
    await show({ plan: "plus" });
    expect(screen.getByTestId("upgrade-form")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Choose Plus" })).toHaveAttribute(
      "href",
      "/settings/plan?section=plans&plan=plus#upgrade-title"
    );
  });

  it("does not expose setup for hidden or unavailable plans", async () => {
    await show({ plan: "unlimited" });
    expect(screen.queryByTestId("upgrade-form")).not.toBeInTheDocument();
    expect(
      screen.getByRole("heading", {
        name: "This plan is not available for purchase",
      })
    ).toBeInTheDocument();
  });

  it("prioritizes an existing payment request instead of starting another", async () => {
    enablePurchases();
    mocks.open.mockResolvedValue({ id: "pending", status: "submitted" });
    await show({ plan: "plus" });
    expect(screen.getByText(/Do not pay again/)).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "View payment request" })
    ).toHaveAttribute("href", "/settings/plan/requests/pending");
    expect(screen.queryByTestId("upgrade-form")).not.toBeInTheDocument();
  });

  it("keeps summaries visible for admin-managed Free without an ineffective upgrade action", async () => {
    enablePurchases();
    const override = {
      planOverride: defaultBillingPlans[0],
      games: null,
      storageBytes: null,
      expiresAt: null,
      updatedAt: now,
    };
    mocks.usage.mockResolvedValue({
      ...baseUsage,
      ...resolveAllowance({ now, override }),
      override,
    });
    await show({ plan: "plus" });
    expect(screen.getAllByRole("article")).toHaveLength(3);
    expect(
      screen.queryByRole("link", { name: "Choose Plus" })
    ).not.toBeInTheDocument();
    expect(screen.queryByTestId("upgrade-form")).not.toBeInTheDocument();
    expect(screen.getByText(/plan is managed by an admin/)).toBeInTheDocument();
  });

  it("scopes both history queries to the authenticated account with bounded pages", async () => {
    await show({ section: "history" });
    const dialect = new PgDialect();
    for (const queryMock of [mocks.requests, mocks.terms]) {
      const query = queryMock.mock.calls[0][0];
      expect(query.limit).toBe(6);
      expect(query.orderBy).toHaveLength(2);
      expect(dialect.sqlToQuery(query.where).params).toContain("account-owner");
    }
  });

  it("paginates plan history without claiming the first five terms are the full history", async () => {
    mocks.terms.mockResolvedValue(
      Array.from({ length: 6 }, (_, index) => ({
        id: `00000000-0000-4000-8000-${String(6 - index).padStart(12, "0")}`,
        requestId: null,
        planVersion: "pro-v1",
        source: "complimentary",
        startsAt: now,
        endsAt: new Date(now.getTime() + 86400_000),
        createdAt: now,
        games: 30,
        storageBytes: 2048 * 1024 * 1024,
      }))
    );
    await show({ section: "history" });
    expect(screen.getAllByText("Pro · Complimentary")).toHaveLength(5);
    const href = screen
      .getByRole("link", { name: "Older plan history" })
      .getAttribute("href")!;
    const cursor = parseAdminCursor(
      new URL(href, "https://relay.example").searchParams.get("terms")
    );
    expect(cursor).toMatchObject({
      id: "00000000-0000-4000-8000-000000000002",
      at: now,
    });
  });

  it("opens legacy history links with both histories visible and no usage queries", async () => {
    mocks.assignment.mockResolvedValue({
      planOverride: defaultBillingPlans[0],
      expiresAt: null,
      updatedAt: now,
    });
    await show({ payments: "1" });
    expect(
      screen.getByRole("heading", { name: "Payment history" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Plan history" })
    ).toBeInTheDocument();
    expect(screen.getByText("Free · Admin-assigned")).toBeInTheDocument();
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(mocks.usage).not.toHaveBeenCalled();
    expect(mocks.settings).not.toHaveBeenCalled();
    expect(mocks.methods).not.toHaveBeenCalled();
    expect(mocks.open).not.toHaveBeenCalled();
    expect(
      new PgDialect().sqlToQuery(mocks.assignment.mock.calls[0][0].where).params
    ).toContain("account-owner");
  });

  it("defaults to current usage without pricing or historical data", async () => {
    await show();
    expect(
      screen.getByRole("link", { name: "Manage photos" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "View plans" })).toHaveAttribute(
      "href",
      "/settings/plan?section=plans"
    );
    expect(screen.queryByRole("article")).not.toBeInTheDocument();
    expect(
      screen.queryByRole("heading", { name: "Plan history" })
    ).not.toBeInTheDocument();
    expect(mocks.methods).not.toHaveBeenCalled();
    expect(mocks.requests).not.toHaveBeenCalled();
    expect(mocks.terms).not.toHaveBeenCalled();
  });

  it("does not query histories before authorization", async () => {
    mocks.user.mockRejectedValue(new Error("Unauthorized"));
    await expect(show()).rejects.toThrow("Unauthorized");
    expect(mocks.terms).not.toHaveBeenCalled();
    expect(mocks.requests).not.toHaveBeenCalled();
  });
});
