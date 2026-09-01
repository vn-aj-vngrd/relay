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
  it("explains the confirmation step after password signup", () => {
    render(<AuthEntry mode="create" />);

    expect(screen.getByRole("status")).toHaveTextContent(
      "Check your email to confirm your Relay account, then return here to sign in.",
    );
  });
});
