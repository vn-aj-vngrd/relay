import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  resetUserPasswordAction: vi.fn(async () => ({})),
}));

import { PasswordResetControl } from "./password-reset-control";

beforeEach(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});
afterEach(cleanup);

describe("PasswordResetControl", () => {
  it("explains that an admin reset preserves MFA and requires an audit reason", () => {
    render(
      <PasswordResetControl
        targetId="90b421fb-70ce-4e86-913f-4f035c516065"
        email="player@example.com"
      />
    );

    fireEvent.click(screen.getByRole("button", { name: "Reset password" }));

    expect(screen.getByRole("dialog")).toHaveAttribute("open");
    expect(
      screen.getByText(/Existing authenticator factors stay connected/)
    ).toBeVisible();
    expect(screen.getByLabelText("Reason")).toBeRequired();
  });
});
