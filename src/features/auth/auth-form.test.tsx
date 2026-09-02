import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createPasswordAccountState: vi.fn(async () => ({})),
  signInWithPassword: vi.fn(),
  signInWithPasswordState: vi.fn(async () => ({})),
}));

import { AuthForm } from "./auth-form";

afterEach(cleanup);

describe("AuthForm", () => {
  it("keeps an unsuccessful sign-in password without applying account-creation rules", () => {
    render(<AuthForm />);
    const password = screen.getByLabelText("Password");

    expect(password).not.toHaveAttribute("minlength");
    fireEvent.change(password, { target: { value: "legacy" } });
    fireEvent.click(screen.getByRole("link", { name: "Create account" }));
    fireEvent.click(screen.getByRole("link", { name: "Sign in" }));

    expect(screen.getByLabelText("Password")).toHaveValue("legacy");
  });

  it("presents one clear primary authentication action at a time", () => {
    render(<AuthForm />);
    expect(screen.getByRole("heading", { name: "Log in to Relay" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    expect(screen.getByRole("link", { name: "Forgot password?" })).toHaveAttribute("href", "/forgot-password");
    expect(screen.queryByText("8 or more characters, including a letter and number.")).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Create account" }));

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeVisible();
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/signup");
    expect(screen.getByRole("button", { name: "Create account" })).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(/security check is being configured/i);
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute("autocomplete", "new-password");
    expect(screen.getByRole("button", { name: "Show password" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Show confirm password" })).toBeVisible();
    expect(screen.getByText("8 or more characters, including a letter and number.")).toBeVisible();
    expect(screen.queryByRole("link", { name: "Forgot password?" })).not.toBeInTheDocument();
  });
});
