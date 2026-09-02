import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  challengeAndVerify: vi.fn(),
  cookieGet: vi.fn(),
  cookieSet: vi.fn(),
  getAuthenticatorAssuranceLevel: vi.fn(),
  getUser: vi.fn(),
  googleEnabled: true,
  listFactors: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
  resetPasswordForEmail: vi.fn(),
  signInWithOAuth: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
  updateUser: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ delete: vi.fn(), get: mocks.cookieGet, set: mocks.cookieSet })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://relay.vanajvanguardia.tech",
    NEXT_PUBLIC_GOOGLE_AUTH_ENABLED: mocks.googleEnabled,
  }),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  requestIdentity: vi.fn(async () => "ip:test"),
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      getUser: mocks.getUser,
      mfa: {
        challengeAndVerify: mocks.challengeAndVerify,
        getAuthenticatorAssuranceLevel: mocks.getAuthenticatorAssuranceLevel,
        listFactors: mocks.listFactors,
      },
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signInWithOAuth: mocks.signInWithOAuth,
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
      updateUser: mocks.updateUser,
    },
  })),
}));
vi.mock("./destination", () => ({ resolvePostAuthDestination: vi.fn() }));
vi.mock("./session", () => ({ getCurrentUser: vi.fn() }));

import {
  createPasswordAccount,
  createPasswordAccountState,
  requestPasswordReset,
  signInWithGoogle,
  signInWithPassword,
  signInWithPasswordState,
  updateRecoveredPassword,
  verifyRecoveryMfa,
} from "./actions";

beforeEach(() => {
  mocks.challengeAndVerify.mockReset();
  mocks.checkRateLimit.mockClear();
  mocks.cookieGet.mockReset();
  mocks.cookieSet.mockClear();
  mocks.getAuthenticatorAssuranceLevel.mockReset();
  mocks.getUser.mockReset();
  mocks.listFactors.mockReset();
  mocks.redirect.mockClear();
  mocks.googleEnabled = true;
  mocks.resetPasswordForEmail.mockReset();
  mocks.signInWithOAuth.mockReset();
  mocks.signInWithPassword.mockReset();
  mocks.signUp.mockReset();
  mocks.updateUser.mockReset();
});

describe("signInWithGoogle", () => {
  it("starts OAuth with the trusted callback and remembers a safe destination", async () => {
    mocks.signInWithOAuth.mockResolvedValue({
      data: { url: "https://accounts.google.com/o/oauth2/v2/auth" },
      error: null,
    });
    const formData = new FormData();
    formData.set("next", "//malicious.example");

    await expect(signInWithGoogle(formData)).rejects.toThrow("redirect");

    expect(mocks.signInWithOAuth).toHaveBeenCalledWith({
      provider: "google",
      options: { redirectTo: "https://relay.vanajvanguardia.tech/auth/callback" },
    });
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "relay_auth_next",
      "/home",
      expect.objectContaining({ httpOnly: true, maxAge: 600, sameSite: "lax" }),
    );
    expect(mocks.redirect).toHaveBeenLastCalledWith("https://accounts.google.com/o/oauth2/v2/auth");
  });

  it("fails closed when Google authentication is not enabled", async () => {
    mocks.googleEnabled = false;

    await expect(signInWithGoogle(new FormData())).rejects.toThrow("redirect");

    expect(mocks.signInWithOAuth).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenCalledWith(
      "/login?error=Google+sign-in+is+not+available+yet.+Sign+in+with+your+email+and+password.",
    );
  });
});

describe("signInWithPassword", () => {
  it("forwards the completed Turnstile token to Supabase password login", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: "invalid_credentials" } });
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("password", "RelayPass123");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(signInWithPassword(formData)).rejects.toThrow("redirect");

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "player@example.com",
      password: "RelayPass123",
      options: { captchaToken: "verified-turnstile-token" },
    });
  });

  it("passes short existing passwords to the provider instead of applying signup rules", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: "invalid_credentials" } });
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("password", "legacy");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(signInWithPasswordState({}, formData)).resolves.toEqual({ error: "Email or password is incorrect." });

    expect(mocks.signInWithPassword).toHaveBeenCalledWith({
      email: "player@example.com",
      password: "legacy",
      options: { captchaToken: "verified-turnstile-token" },
    });
  });

  it("returns invalid credentials to the mounted form without redirecting it", async () => {
    mocks.signInWithPassword.mockResolvedValue({ data: { user: null }, error: { code: "invalid_credentials" } });
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("password", "RelayPass123");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(signInWithPasswordState({}, formData)).resolves.toEqual({ error: "Email or password is incorrect." });

    expect(mocks.redirect).not.toHaveBeenCalled();
  });
});

describe("requestPasswordReset", () => {
  it("forwards Turnstile to Supabase and remembers which email received the request", async () => {
    mocks.resetPasswordForEmail.mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(requestPasswordReset(formData)).rejects.toThrow("redirect");

    expect(mocks.resetPasswordForEmail).toHaveBeenCalledWith("player@example.com", {
      captchaToken: "verified-turnstile-token",
      redirectTo: "https://relay.vanajvanguardia.tech/auth/callback?recovery=1",
    });
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "relay_recovery_email",
      "player@example.com",
      expect.objectContaining({ httpOnly: true, maxAge: 600, path: "/forgot-password" }),
    );
  });
});

describe("verifyRecoveryMfa", () => {
  it("upgrades an email recovery session with its verified authenticator before password entry", async () => {
    mocks.cookieGet.mockReturnValue({ value: "1" });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "recovery-user" } }, error: null });
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    mocks.listFactors.mockResolvedValue({
      data: { totp: [{ id: "verified-factor", status: "verified" }] },
      error: null,
    });
    mocks.challengeAndVerify.mockResolvedValue({ error: null });
    const formData = new FormData();
    formData.set("code", "123456");

    await expect(verifyRecoveryMfa(formData)).rejects.toThrow("redirect");

    expect(mocks.challengeAndVerify).toHaveBeenCalledWith({ factorId: "verified-factor", code: "123456" });
    expect(mocks.redirect).toHaveBeenLastCalledWith("/update-password");
  });
});

describe("updateRecoveredPassword", () => {
  it("refuses the password mutation until an MFA account reaches AAL2", async () => {
    mocks.cookieGet.mockReturnValue({ value: "1" });
    mocks.getUser.mockResolvedValue({ data: { user: { id: "recovery-user" } }, error: null });
    mocks.getAuthenticatorAssuranceLevel.mockResolvedValue({
      data: { currentLevel: "aal1", nextLevel: "aal2" },
      error: null,
    });
    const formData = new FormData();
    formData.set("password", "NewRelayPass123");
    formData.set("confirmation", "NewRelayPass123");

    await expect(updateRecoveredPassword(formData)).rejects.toThrow("redirect");

    expect(mocks.updateUser).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith(
      "/update-password?error=Verify+your+authenticator+before+choosing+a+new+password.",
    );
  });
});

describe("createPasswordAccount", () => {
  it("returns branded field errors without invoking native browser validation", async () => {
    const formData = new FormData();
    formData.set("email", "not-an-email");
    formData.set("password", "short");
    formData.set("confirmation", "different");

    await expect(createPasswordAccountState({}, formData)).resolves.toEqual({
      error: "Check the fields marked below.",
      fieldErrors: {
        email: ["Enter a valid email address."],
        password: ["Use at least 8 characters, including a letter and number."],
      },
    });

    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("returns a field error when password confirmation does not match", async () => {
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("password", "RelayPass123");
    formData.set("confirmation", "DifferentPass123");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(createPasswordAccountState({}, formData)).resolves.toEqual({
      error: "Check the fields marked below.",
      fieldErrors: { confirmation: ["Passwords do not match."] },
    });

    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.redirect).not.toHaveBeenCalled();
  });

  it("rejects mismatched password confirmation before creating an account", async () => {
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("password", "RelayPass123");
    formData.set("confirmation", "DifferentPass123");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(createPasswordAccount(formData)).rejects.toThrow("redirect");

    expect(mocks.signUp).not.toHaveBeenCalled();
    expect(mocks.redirect).toHaveBeenLastCalledWith("/signup?error=Passwords+do+not+match.");
  });

  it("forwards the completed Turnstile token to Supabase for one authoritative verification", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null, user: {} }, error: null });
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("password", "RelayPass123");
    formData.set("confirmation", "RelayPass123");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(createPasswordAccount(formData)).rejects.toThrow("redirect");

    expect(mocks.checkRateLimit).toHaveBeenCalledWith(
      { scope: "password-sign-up:account", limit: 10, windowSeconds: 3600 },
      "email:player@example.com",
    );
    expect(mocks.signUp).toHaveBeenCalledWith({
      email: "player@example.com",
      password: "RelayPass123",
      options: {
        captchaToken: "verified-turnstile-token",
        emailRedirectTo: "https://relay.vanajvanguardia.tech/auth/callback",
      },
    });
    expect(mocks.cookieSet).toHaveBeenCalledWith(
      "relay_confirmation_email",
      "player@example.com",
      expect.objectContaining({ httpOnly: true, maxAge: 600, path: "/signup" }),
    );
  });
});
