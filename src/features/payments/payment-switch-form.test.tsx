import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  updatePaymentChoiceState: vi.fn(async () => ({})),
}));

import { updatePaymentChoiceState } from "./actions";
import { PaymentSwitchForm } from "./payment-switch-form";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
    this.dispatchEvent(new Event("close"));
  };
});

describe("switch payment confirmation", () => {
  it("requires confirmation and leaves collection unchanged on cancellation", () => {
    const { container } = render(
      <PaymentSwitchForm sessionId="game" revision="current-revision" />
    );
    fireEvent.click(screen.getByRole("button", { name: "Payment choice" }));
    expect(
      screen.queryByRole("option", { name: "Decide later" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("option", { name: "Free" }));
    expect(updatePaymentChoiceState).not.toHaveBeenCalled();
    fireEvent.click(screen.getByRole("button", { name: "Make game free" }));
    const dialog = screen.getByRole("dialog", { name: "Make this game free?" });
    expect(
      within(dialog).getByText(/Relay does not issue refunds/)
    ).toBeVisible();
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Keep collecting" })
    );
    expect(updatePaymentChoiceState).not.toHaveBeenCalled();
    expect(
      container.querySelector('input[name="paymentRevision"]')
    ).toHaveValue("current-revision");
  });
});
