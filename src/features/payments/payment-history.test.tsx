import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./payment-management-forms", () => ({
  PaymentAdjustmentResponse: () => null,
}));

import { PaymentHistory } from "./payment-history";

import { expenseFixture, paymentFixture } from "./test-fixtures";

const collections = [
  {
    expense: expenseFixture({ id: "old", archivedAt: new Date() }),
    receiptUrl: "/receipt",
  },
];

describe("retained payment history", () => {
  it("shows paid and proof records without payment or review controls", () => {
    render(
      <PaymentHistory
        collections={collections}
        payments={[
          {
            payment: paymentFixture({
              id: "paid",
              expenseId: "old",
              status: "confirmed",
            }),
            name: "Sam",
            proofUrl: "/proof",
          },
          {
            payment: paymentFixture({ id: "unpaid", expenseId: "old" }),
            name: "Lee",
          },
        ]}
      />
    );
    expect(
      screen.getByRole("heading", { name: "Payment history" })
    ).toBeVisible();
    expect(screen.getByText(/Relay does not issue refunds/)).toBeVisible();
    expect(
      screen.getByText("Request cancelled · No payment due")
    ).toBeInTheDocument();
    expect(screen.getByText("View retained payment proof")).toHaveAttribute(
      "href",
      "/proof"
    );
    expect(
      screen.queryByRole("button", { hidden: true })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByText("Pay the host, then upload proof.")
    ).not.toBeInTheDocument();
  });
});
