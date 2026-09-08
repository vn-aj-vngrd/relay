import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  updatePaymentChoiceState: vi.fn(async () => ({})),
  updateExpenseState: vi.fn(),
  updatePlayerPaymentAmountState: vi.fn(),
  requestNewPaymentProofState: vi.fn(),
}));
vi.mock("./adjustment-actions", () => ({
  respondToPaymentAdjustment: vi.fn(),
}));
vi.mock("./assign-share-action", () => ({ assignPlayerShare: vi.fn() }));

import { updateExpenseState, updatePaymentChoiceState } from "./actions";
import { EditExpenseForm, PaymentChoiceForm } from "./payment-management-forms";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("payment choice in settings", () => {
  it("requires review before collecting again and does not restore old obligations", () => {
    render(
      <PaymentChoiceForm
        sessionId="game"
        price={0}
        bookingTotalCents={null}
        revision="reviewed"
        hasHistory
        previousDefaults={{
          label: "Court",
          total: "1200",
          method: "Maya",
          details: "Saved instructions",
        }}
      />
    );
    fireEvent.click(screen.getByRole("button", { name: "Payment choice" }));
    expect(
      screen.queryByRole("option", { name: "Decide later" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Collect payment" }));
    expect(screen.getByLabelText("Payment details")).toHaveValue("");
    fireEvent.click(
      screen.getByRole("button", { name: "Use previous setup values" })
    );
    expect(screen.getByLabelText("Payment details")).toHaveValue(
      "Saved instructions"
    );
    fireEvent.click(
      screen.getByRole("button", { name: "Save payment settings" })
    );
    expect(
      screen.getByRole("dialog", { name: "Start collecting payment?" })
    ).toBeVisible();
    expect(
      screen.getByText(/Existing players must agree to new charges/)
    ).toBeVisible();
  });
  it.each([false, true])(
    "shows server field feedback and preserves values (editing: %s)",
    async (editing) => {
      vi.mocked(
        editing ? updateExpenseState : updatePaymentChoiceState
      ).mockResolvedValueOnce({
        error: "Check the highlighted fields below.",
        fieldErrors: { details: "Enter payment instructions." },
      });
      render(
        editing ? (
          <EditExpenseForm
            sessionId="game"
            expenseId="expense"
            totalReadOnly={false}
            defaults={{ total: "1200", label: "Court", method: "GCash" }}
          />
        ) : (
          <PaymentChoiceForm
            sessionId="game"
            price={null}
            bookingTotalCents={120000}
            collectionRequested
          />
        )
      );
      fireEvent.change(screen.getByLabelText("Amount (₱)"), {
        target: { value: "2000" },
      });
      fireEvent.submit(
        screen
          .getByRole("button", { name: "Save payment settings" })
          .closest("form")!
      );
      await waitFor(() =>
        expect(screen.getByLabelText("Payment details")).toHaveAttribute(
          "aria-invalid",
          "true"
        )
      );
      expect(
        screen.getByLabelText("Payment details")
      ).toHaveAccessibleDescription("Enter payment instructions.");
      expect(screen.getByLabelText("Total amount")).toHaveValue(2000);
      expect(screen.getByLabelText("Amount (₱)")).toHaveAttribute(
        "aria-invalid",
        "false"
      );
    }
  );
  it("opens the complete setup for saved collection intent", () => {
    render(
      <PaymentChoiceForm
        sessionId="game"
        price={null}
        bookingTotalCents={120000}
        collectionRequested
      />
    );
    expect(
      screen.getByRole("button", { name: "Payment choice" })
    ).toHaveTextContent("Collect payment");
    expect(screen.getByLabelText("Total amount")).toHaveValue(1200);
    expect(screen.getByLabelText("Payment details")).toBeVisible();
    expect(screen.getByLabelText("Payment details")).toBeRequired();
    expect(screen.getByText("Player payment")).toHaveClass("sr-only");
    fireEvent.click(screen.getByRole("button", { name: "Payment choice" }));
    fireEvent.click(screen.getByRole("option", { name: "Free" }));
    expect(screen.getByLabelText("Payment details")).toBeDisabled();
  });
  it("keeps an explicit Free price authoritative over historical intent", () => {
    render(
      <PaymentChoiceForm
        sessionId="game"
        price={0}
        bookingTotalCents={null}
        collectionRequested
      />
    );
    expect(
      screen.getByRole("button", { name: "Payment choice" })
    ).toHaveTextContent("Free");
    expect(screen.getByLabelText("Payment details")).toBeDisabled();
  });
});
