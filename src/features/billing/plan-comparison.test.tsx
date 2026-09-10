import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { defaultBillingPlans } from "./domain";
import { PlanCards, PlanComparison, PricingQuestions } from "./plan-comparison";

const catalog = defaultBillingPlans.map((plan) =>
  plan.id === "plus"
    ? { ...plan, priceCents: 18950, games: 17, storageBytes: 750 * 1024 * 1024 }
    : plan
);

describe("shared pricing presentation", () => {
  it("hides internal and unpublished plans in cards and comparison columns", () => {
    const hidden = catalog.map((plan) => ({
      ...plan,
      visible: plan.id !== "plus",
    }));
    render(
      <>
        <PlanCards catalog={hidden} />
        <PlanComparison catalog={hidden} />
      </>
    );
    expect(
      screen.queryByRole("article", { name: "Unlimited plan" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("article", { name: "Plus plan" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Plus" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("columnheader", { name: "Unlimited" })
    ).not.toBeInTheDocument();
  });
  it("keeps billing labels aligned when Free is hidden", () => {
    render(
      <PlanComparison
        catalog={catalog.map((plan) => ({
          ...plan,
          visible: plan.id === "pro",
        }))}
      />
    );
    const row = within(screen.getByRole("row", { name: /Who subscribes/ }));
    expect(
      row.getByRole("cell", { name: "Individual host" })
    ).toBeInTheDocument();
    expect(
      row.queryByRole("cell", { name: "No payment needed" })
    ).not.toBeInTheDocument();
  });
  it("shows monthly games, total storage and Coming soon without a purchase link", () => {
    render(<PlanCards catalog={catalog} />);
    const plus = within(screen.getByRole("article", { name: "Plus plan" }));
    expect(plus.getByText("₱189.5")).toBeInTheDocument();
    expect(plus.getByText("17 games per month")).toBeInTheDocument();
    expect(plus.getByText("750 MiB")).toBeInTheDocument();
    expect(plus.getByText("Coming soon")).toBeInTheDocument();
    expect(plus.getByText("Not available yet")).toBeInTheDocument();
    const free = screen.getByRole("article", { name: "Free plan" });
    expect(free).toHaveClass("border-primary");
    expect(within(free).getByText("Available now")).toHaveClass("text-success");
    expect(plus.queryByRole("link")).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Start with Free" })
    ).toHaveAttribute("href", "/signup");
  });
  it("uses the same dynamic limits in the comparison table", () => {
    render(<PlanComparison catalog={catalog} />);
    const row = within(
      screen.getByRole("row", { name: /Games you can create per month/ })
    );
    expect(row.getByRole("cell", { name: "17 games" })).toBeInTheDocument();
    expect(screen.getByRole("cell", { name: "₱189.5" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Plus" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: /scroll horizontally/ })
    ).toHaveAttribute("tabindex", "0");
  });
  it("requires both plan activation and payment readiness for purchase navigation", () => {
    const active = catalog.map((plan) => ({
      ...plan,
      availability: "active" as const,
    }));
    const { rerender } = render(
      <PlanCards catalog={active} acceptingPayments={false} />
    );
    expect(
      screen.queryByRole("link", { name: /View Plus/ })
    ).not.toBeInTheDocument();
    expect(screen.getAllByText("Purchases paused")).toHaveLength(2);
    expect(
      screen.getAllByText("Purchases are temporarily paused")
    ).toHaveLength(2);
    rerender(<PlanCards catalog={active} acceptingPayments />);
    expect(
      screen.getByRole("link", { name: "View Plus payment options" })
    ).toHaveAttribute("href", "/settings/plan?section=plans");
  });
  it("keeps availability visible alongside the current tier", () => {
    render(<PlanCards catalog={catalog} account currentPlan="plus" />);
    const plus = within(screen.getByRole("article", { name: "Plus plan" }));
    expect(plus.getByText("Your current tier")).toBeInTheDocument();
    expect(plus.getByText("Coming soon")).toBeInTheDocument();
  });
  it("does not promote Free when its availability is changed by an admin", () => {
    render(
      <PlanCards
        catalog={catalog.map((plan) => ({
          ...plan,
          availability: "coming_soon" as const,
        }))}
      />
    );
    expect(screen.getByRole("article", { name: "Free plan" })).not.toHaveClass(
      "border-primary"
    );
    expect(
      screen.queryByRole("link", { name: "Start with Free" })
    ).not.toBeInTheDocument();
  });
  it("explains monthly reset, owner-funded photos and manual payments", () => {
    render(<PricingQuestions />);
    expect(screen.getByText(/not each match or round/)).toBeInTheDocument();
    expect(screen.getByText(/not a fixed 30 days/)).toBeInTheDocument();
    expect(screen.getByText(/A Free player in a Pro host/)).toBeInTheDocument();
    expect(screen.getByText(/no automatic debit/)).toBeInTheDocument();
  });
});
