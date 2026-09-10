import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ request: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/features/auth/session", () => ({
  requireUser: async () => ({ id: "account-owner" }),
}));
vi.mock("@/db/client", () => ({
  db: { query: { billingRequests: { findFirst: mocks.request } } },
}));
vi.mock("@/features/billing/account-billing", () => ({
  AccountBilling: () => <div>Account billing</div>,
}));
vi.mock("@/features/billing/files", () => ({
  billingFileUrl: async () => null,
}));
vi.mock("@/features/billing/forms", () => ({
  CancelUpgradeForm: () => <div>Cancel unpaid request</div>,
  SubscriptionPaymentForm: () => <div>Submit payment</div>,
}));

import PlanPage from "@/app/(app)/settings/plan/page";
import PaymentRequestPage from "@/app/(app)/settings/plan/requests/[id]/page";
import { defaultBillingPlans } from "./domain";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("subscription payment help entry points", () => {
  it.each(["current", "plans", "history"])(
    "links to the public guide from the %s billing section",
    async (section) => {
      render(await PlanPage({ searchParams: Promise.resolve({ section }) }));
      expect(
        screen.getByRole("link", {
          name: "How to pay for a Relay subscription",
        })
      ).toHaveAttribute("href", "/help/subscription-payments");
    }
  );

  it.each([
    "awaiting_payment",
    "submitted",
    "clarification",
    "approved",
    "rejected",
    "cancelled",
  ])("keeps help available for a %s payment request", async (status) => {
    const id = "00000000-0000-4000-8000-000000000001";
    mocks.request.mockResolvedValue({
      id,
      status,
      planVersion: defaultBillingPlans.find((plan) => plan.id === "plus")
        ?.version,
      amountCents: 10000,
      games: 10,
      storageBytes: 1024,
      reviewNote: null,
      proofPath: null,
      transactionReference: null,
      snapshot: {
        provider: "GCash",
        recipient: "Relay",
        account: "test-account",
        instructions: "Pay the exact amount.",
        qrPath: null,
        reviewTime: "Within two business days",
        supportContact: "billing@example.com",
        policy: "Contact billing support about refunds.",
      },
    });
    render(await PaymentRequestPage({ params: Promise.resolve({ id }) }));
    expect(
      screen.getByRole("link", {
        name: "How to pay for a Relay subscription",
      })
    ).toHaveAttribute("href", "/help/subscription-payments");
  });
});
