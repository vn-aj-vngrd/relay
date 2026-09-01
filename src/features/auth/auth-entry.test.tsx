import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams("sent=account"),
}));

vi.mock("./actions", () => ({
  createPasswordAccount: vi.fn(),
  signInWithGoogle: vi.fn(),
  signInWithPassword: vi.fn(),
}));

import { AuthEntry } from "./auth-entry";

afterEach(cleanup);

describe("AuthEntry", () => {
  it("replaces account creation with a focused, email-specific confirmation state", () => {
    render(<AuthEntry mode="create" confirmationEmail="player@example.com" />);

    expect(screen.getByText(/Confirmation sent to/)).toHaveTextContent("Confirmation sent to player@example.com");
    expect(screen.getByRole("heading", { name: "Check your inbox" })).toBeVisible();
    expect(screen.getByRole("link", { name: /Return to sign in/ })).toHaveAttribute("href", "/login");
    expect(screen.getByRole("link", { name: "Create another account" })).toHaveAttribute("href", "/signup");
    expect(screen.queryByRole("textbox", { name: "Email" })).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Create account" })).not.toBeInTheDocument();
  });
});
