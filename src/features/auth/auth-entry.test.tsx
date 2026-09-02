import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ search: "sent=account" }));

vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(mocks.search),
}));

vi.mock("./actions", () => ({
  createPasswordAccountState: vi.fn(async () => ({})),
  signInWithGoogle: vi.fn(),
  signInWithPassword: vi.fn(),
  signInWithPasswordState: vi.fn(async () => ({})),
}));

import { AuthEntry } from "./auth-entry";

beforeEach(() => {
  mocks.search = "sent=account";
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "false");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

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

  it("offers Google sign-in only when the provider is configured", () => {
    mocks.search = "next=/games";
    vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");

    render(<AuthEntry mode="signin" />);

    const googleButton = screen.getByRole("button", { name: "Continue with Google" });
    expect(googleButton).toBeVisible();
    expect(googleButton.querySelector("img")).toHaveAttribute("src", expect.stringContaining("google-g.svg"));
    expect(googleButton.closest("form")?.querySelector('input[name="next"]')).toHaveValue("/games");
    expect(screen.getByRole("link", { name: "Create account" })).toHaveAttribute("href", "/signup?next=%2Fgames");
    const legalCopy = screen.getByText(/By signing in/);
    expect(googleButton.compareDocumentPosition(legalCopy) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(screen.getByRole("link", { name: "Terms" })).toHaveAttribute("href", "/terms");
    expect(screen.getByRole("link", { name: "Privacy Policy" })).toHaveAttribute("href", "/privacy");

    fireEvent.click(screen.getByRole("link", { name: "Create account" }));
    expect(screen.getByText(/By creating an account/)).toBeVisible();
  });
});
