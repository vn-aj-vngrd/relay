import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  createPasswordAccount: vi.fn(),
  signInWithPassword: vi.fn(),
}));

import { AuthForm } from "./auth-form";

afterEach(cleanup);

describe("AuthForm", () => {
  it("presents one clear primary authentication action at a time", () => {
    render(<AuthForm />);
    expect(screen.getByRole("heading", { name: "Log in to Relay" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Sign in" })).toHaveLength(2);
    expect(screen.getByText(/By signing in/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("heading", { name: "Create your account" })).toBeVisible();
    expect(screen.getByText(/By creating an account/)).toBeVisible();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");
    expect(screen.getAllByRole("button", { name: "Create account" })).toHaveLength(2);
    expect(
      screen.getAllByRole("button", { name: "Create account" }).find((button) => button.hasAttribute("disabled")),
    ).toBeDisabled();
    expect(screen.getByText(/security check is being configured/i)).toHaveAttribute("role", "alert");
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
  });
});
