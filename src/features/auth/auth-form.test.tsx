import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  createAccount: vi.fn(async () => ({})),
  signIn: vi.fn(async () => ({
    error: "Email or password is incorrect.",
    refreshCaptcha: true,
  })),
}));

vi.mock("@marsidev/react-turnstile", async () => {
  const { forwardRef, useImperativeHandle } = await import("react");
  return {
    Turnstile: forwardRef(function MockTurnstile(
      {
        onSuccess,
        options,
      }: {
        onSuccess: (token: string) => void;
        options: { appearance?: string };
      },
      ref
    ) {
      useImperativeHandle(ref, () => ({
        reset: () => onSuccess("refreshed-token"),
      }));
      return (
        <button
          type="button"
          data-appearance={options.appearance}
          onClick={() => onSuccess("initial-token")}
        >
          Complete security check
        </button>
      );
    }),
  };
});

vi.mock("./actions", () => ({
  createPasswordAccountState: mocks.createAccount,
  signInWithPassword: vi.fn(),
  signInWithPasswordState: mocks.signIn,
}));

import { AuthForm } from "./auth-form";

beforeEach(() => {
  mocks.createAccount.mockReset();
  mocks.createAccount.mockResolvedValue({});
  mocks.signIn.mockReset();
  mocks.signIn.mockResolvedValue({
    error: "Email or password is incorrect.",
    refreshCaptcha: true,
  });
});

afterEach(() => {
  cleanup();
  vi.unstubAllEnvs();
});

describe("AuthForm", () => {
  it("keeps login values after an unsuccessful sign-in without applying account-creation rules", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
    render(<AuthForm />);
    const email = screen.getByLabelText("Email");
    const password = screen.getByLabelText("Password");

    expect(password).not.toHaveAttribute("minlength");
    fireEvent.change(email, { target: { value: "player@example.com" } });
    fireEvent.change(password, { target: { value: "legacy" } });
    fireEvent.click(
      screen.getByRole("button", { name: "Complete security check" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Sign in" }));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(
        "Email or password is incorrect."
      )
    );
    expect(screen.getByLabelText("Email")).toHaveValue("player@example.com");
    expect(screen.getByLabelText("Password")).toHaveValue("legacy");
    expect(
      screen.getByRole("button", { name: "Complete security check" })
    ).toHaveAttribute("data-appearance", "always");
    await waitFor(() =>
      expect(screen.getByRole("button", { name: "Sign in" })).toBeEnabled()
    );

    fireEvent.change(password, { target: { value: "another-password" } });
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  });

  it("clears a field error as soon as the user edits that field without repeating an unused challenge", async () => {
    vi.stubEnv("NEXT_PUBLIC_TURNSTILE_SITE_KEY", "test-site-key");
    mocks.createAccount.mockResolvedValueOnce({
      error: "Check the fields marked below.",
      fieldErrors: { email: ["Enter a valid email address."] },
    });
    render(<AuthForm initialMode="create" />);

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "wrong" },
    });
    fireEvent.change(screen.getByLabelText("Password"), {
      target: { value: "RelayPass123" },
    });
    fireEvent.change(screen.getByLabelText("Confirm password"), {
      target: { value: "RelayPass123" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Complete security check" })
    );
    fireEvent.click(screen.getByRole("button", { name: "Create account" }));

    await waitFor(() =>
      expect(screen.getByText("Enter a valid email address.")).toBeVisible()
    );
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "true"
    );
    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "player@example.com" },
    });

    expect(
      screen.queryByText("Enter a valid email address.")
    ).not.toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toHaveAttribute(
      "aria-invalid",
      "false"
    );
    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeEnabled();
  });

  it("presents one clear primary authentication action at a time", () => {
    render(<AuthForm />);
    expect(
      screen.getByRole("heading", { name: "Log in to Relay" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Sign in" })).toHaveAttribute(
      "href",
      "/login"
    );
    expect(screen.getByRole("button", { name: "Sign in" })).toBeDisabled();
    expect(
      screen.getByRole("link", { name: "Forgot password?" })
    ).toHaveAttribute("href", "/forgot-password");
    expect(
      screen.queryByText("8 or more characters, including a letter and number.")
    ).not.toBeInTheDocument();

    fireEvent.click(screen.getByRole("link", { name: "Create account" }));

    expect(
      screen.getByRole("heading", { name: "Create your account" })
    ).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Create account" })
    ).toHaveAttribute("href", "/signup");
    expect(
      screen.getByRole("button", { name: "Create account" })
    ).toBeDisabled();
    expect(screen.getByRole("alert")).toHaveTextContent(
      /security check is being configured/i
    );
    expect(screen.getByLabelText("Password")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(screen.getByLabelText("Confirm password")).toHaveAttribute(
      "autocomplete",
      "new-password"
    );
    expect(screen.getByRole("button", { name: "Show password" })).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Show confirm password" })
    ).toBeVisible();
    expect(
      screen.getByText("8 or more characters, including a letter and number.")
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Forgot password?" })
    ).not.toBeInTheDocument();
  });
});
