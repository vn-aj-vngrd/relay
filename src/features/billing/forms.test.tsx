import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  saveBillingSettings: vi.fn(),
  saveBillingPlan: vi.fn(),
  saveBillingMethod: vi.fn(),
  createUpgradeRequest: vi.fn(),
  submitSubscriptionPayment: vi.fn(),
  cancelUpgradeRequest: vi.fn(),
  reviewSubscriptionPayment: vi.fn(),
  saveAccountOverrides: vi.fn(),
  grantComplimentaryPro: vi.fn(),
}));
vi.mock("./media-actions", () => ({
  cleanupStalledUpload: vi.fn(),
  removeHostedPhoto: vi.fn(),
  setParticipantImages: vi.fn(),
}));

import { defaultBillingPlans } from "./domain";
import {
  AccountOverrideForm,
  BillingMethodForm,
  BillingPlanForm,
  BillingSettingsForm,
  PaymentReviewForm,
  UpgradeForm,
} from "./forms";

describe("subscription forms", () => {
  it("exposes current commercial values and requires confirmation before publication", () => {
    const plan = defaultBillingPlans[1];
    render(<BillingPlanForm plan={plan} />);
    expect(screen.getByLabelText("Price per month (PHP)")).toHaveValue("149");
    expect(screen.getByLabelText("Games per month")).toHaveValue(12);
    expect(
      screen.getByLabelText("Total photo storage (MiB, not monthly)")
    ).toHaveValue(500);
    expect(
      screen.getByRole("checkbox", { name: /reviewed the monthly price/ })
    ).not.toBeChecked();
  });
  it("lets admins configure both QR and copyable recipient details", () => {
    render(<BillingMethodForm />);
    expect(
      screen.getByLabelText("Recipient / account name")
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText("Account number / mobile number")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Payment QR (optional)")).toHaveAttribute(
      "type",
      "file"
    );
    expect(
      screen.getByRole("checkbox", { name: /checked the recipient/ })
    ).not.toBeChecked();
  });
  it("does not enable sales by default", () => {
    render(<BillingSettingsForm />);
    expect(
      screen.getByRole("checkbox", { name: /Enable paid-plan purchases/ })
    ).not.toBeChecked();
    expect(
      screen.getByLabelText("Refund, dispute and media-retention policy")
    ).toBeInTheDocument();
  });
  it("clearly labels manual renewal, price and activation timing", () => {
    render(
      <UpgradeForm
        methods={[{ id: "method", provider: "GCash", recipient: "Relay" }]}
        renewing={false}
        catalog={defaultBillingPlans.map((plan) => ({
          ...plan,
          availability: plan.id === "pro" ? "active" : plan.availability,
        }))}
      />
    );
    expect(
      screen.getByRole("button", { name: "Request Pro — ₱299 for one month" })
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Manual renewal; no automatic charge/)
    ).toBeInTheDocument();
  });
  it("does not pre-confirm receipt of payment", () => {
    render(<PaymentReviewForm id="request" />);
    expect(
      screen.getByRole("checkbox", { name: /actual receiving account/ })
    ).not.toBeChecked();
    expect(
      screen.getByLabelText(/Actual received transaction reference/)
    ).toBeInTheDocument();
  });
  it("distinguishes inherited from custom zero allowances", () => {
    render(
      <AccountOverrideForm
        userId="user"
        override={{ games: 0, storageBytes: null, expiresAt: null }}
      />
    );
    expect(screen.getByLabelText(/Games per period/)).toHaveValue(0);
    expect(screen.getByLabelText(/Media storage in MiB/)).toHaveValue(null);
  });
});
