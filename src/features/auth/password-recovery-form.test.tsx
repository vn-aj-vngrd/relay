import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@marsidev/react-turnstile", () => ({
  Turnstile: ({ onSuccess }: { onSuccess: (token: string) => void }) => (
    <button type="button" onClick={() => onSuccess("test-token")}>
      Complete security check
    </button>
  ),
}));

vi.mock("./actions", () => ({
  requestPasswordResetState: vi.fn(async () => ({})),
}));

import { PasswordRecoveryForm } from "./password-recovery-form";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("PasswordRecoveryForm", () => {
  it("requires the security check before enabling password recovery", () => {
    render(<PasswordRecoveryForm />);

    const submit = screen.getByRole("button", { name: "Send reset link" });
    expect(screen.getByLabelText("Email")).toHaveAttribute("autocomplete", "email");
    expect(submit).toBeDisabled();

    fireEvent.click(screen.getByRole("button", { name: "Complete security check" }));

    expect(submit).toBeEnabled();
    expect(screen.getByRole("link", { name: "Return to login" })).toHaveAttribute("href", "/login");
  });
});
