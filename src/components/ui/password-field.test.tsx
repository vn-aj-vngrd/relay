import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PasswordField } from "./password-field";

describe("PasswordField", () => {
  it("lets the user reveal and hide a password without clearing it", () => {
    render(
      <PasswordField
        id="new-password"
        name="password"
        label="New password"
        autoComplete="new-password"
        required
      />
    );
    const input = screen.getByLabelText("New password");
    fireEvent.change(input, { target: { value: "RelayPass123" } });

    fireEvent.click(screen.getByRole("button", { name: "Show new password" }));
    expect(input).toHaveAttribute("type", "text");
    expect(input).toHaveValue("RelayPass123");

    fireEvent.click(screen.getByRole("button", { name: "Hide new password" }));
    expect(input).toHaveAttribute("type", "password");
  });
});
