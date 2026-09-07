import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./payment-management-forms", () => ({
  PaymentAdjustmentResponse: () => null,
}));

import { PaymentCollectionProgress } from "./payment-breakdown";

function amount(label: string) {
  const region = screen.getByRole("region", { name: "Payment progress" });
  return within(region).getByText(label).parentElement?.querySelector("dd")
    ?.textContent;
}

describe("payment collection progress", () => {
  it("subtracts only confirmed amounts, not submitted proof or excluded shares", () => {
    render(
      <PaymentCollectionProgress
        expenseTotalCents={120000}
        payments={[
          { amountCents: 40000, status: "confirmed" },
          { amountCents: 40000, status: "sent" },
          { amountCents: 40000, status: "unpaid" },
          { amountCents: 40000, status: "excluded" },
        ]}
      />
    );
    expect(amount("Player total")).toBe("₱1,200");
    expect(amount("Paid")).toBe("₱400");
    expect(amount("Left to pay")).toBe("₱800");
  });

  it("reaches zero without treating a host shortfall as player debt", () => {
    render(
      <PaymentCollectionProgress
        expenseTotalCents={120000}
        payments={[
          { amountCents: 100000, status: "confirmed" },
          { amountCents: 0, status: "unpaid" },
        ]}
      />
    );
    expect(amount("Left to pay")).toBe("₱0");
    expect(screen.getByText("All player payments confirmed.")).toBeVisible();
    expect(
      screen.getByText("Host covers ₱200 beyond player shares.")
    ).toBeVisible();
  });

  it("keeps fixed-price surplus separate from the amount still due", () => {
    render(
      <PaymentCollectionProgress
        expenseTotalCents={100000}
        payments={[{ amountCents: 120000, status: "unpaid" }]}
      />
    );
    expect(amount("Left to pay")).toBe("₱1,200");
    expect(
      screen.getByText("Player shares are ₱200 above expenses.")
    ).toBeVisible();
  });

  it("does not call an unassigned payment fully paid", () => {
    render(
      <PaymentCollectionProgress expenseTotalCents={120000} payments={[]} />
    );
    expect(amount("Left to pay")).toBe("₱0");
    expect(screen.getByText("No player shares assigned yet.")).toBeVisible();
    expect(
      screen.queryByText("All player payments confirmed.")
    ).not.toBeInTheDocument();
  });
});
