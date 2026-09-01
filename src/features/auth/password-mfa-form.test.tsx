import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { PasswordMfaForm } from "./password-mfa-form";

describe("PasswordMfaForm", () => {
  it("asks for the current six-digit authenticator code before password entry", () => {
    render(<PasswordMfaForm action={vi.fn()} description="Confirm this password change." />);

    expect(screen.getByRole("heading", { name: "Verify your authenticator" })).toBeVisible();
    expect(screen.getByLabelText("Six-digit code")).toHaveAttribute("pattern", "[0-9]{6}");
    expect(screen.getByRole("button", { name: "Verify and continue" })).toBeEnabled();
  });
});
