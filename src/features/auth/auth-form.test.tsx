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
    expect(screen.getByRole("heading", { name: "Welcome back" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Sign in" })).toHaveLength(2);

    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    expect(screen.getByRole("heading", { name: "Join your next game" })).toBeVisible();
    expect(screen.getAllByRole("button", { name: "Create account" })).toHaveLength(2);
    expect(screen.getByLabelText("Password")).toHaveAttribute("autocomplete", "new-password");
  });
});
