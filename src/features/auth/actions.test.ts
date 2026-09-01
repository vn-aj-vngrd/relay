import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  cookieSet: vi.fn(),
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
  resetPasswordForEmail: vi.fn(),
  signInWithPassword: vi.fn(),
  signUp: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({
  cookies: vi.fn(async () => ({ delete: vi.fn(), get: vi.fn(), set: mocks.cookieSet })),
}));
vi.mock("next/navigation", () => ({ redirect: mocks.redirect }));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://relay.vanajvanguardia.tech" }),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
  requestIdentity: vi.fn(async () => "ip:test"),
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(async () => ({
    auth: {
      resetPasswordForEmail: mocks.resetPasswordForEmail,
      signInWithPassword: mocks.signInWithPassword,
      signUp: mocks.signUp,
    },
  })),
}));
vi.mock("./destination", () => ({ resolvePostAuthDestination: vi.fn() }));
vi.mock("./session", () => ({ getCurrentUser: vi.fn() }));

import { createPasswordAccount, requestPasswordReset, signInWithPassword } from "./actions";

beforeEach(() => {
  mocks.cookieSet.mockClear();
  mocks.redirect.mockClear();
  mocks.resetPasswordForEmail.mockReset();
  mocks.signInWithPassword.mockReset();
  mocks.signUp.mockReset();
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

describe("createPasswordAccount", () => {
  it("forwards the completed Turnstile token to Supabase for one authoritative verification", async () => {
    mocks.signUp.mockResolvedValue({ data: { session: null, user: {} }, error: null });
    const formData = new FormData();
    formData.set("email", "player@example.com");
    formData.set("password", "RelayPass123");
    formData.set("cf-turnstile-response", "verified-turnstile-token");

    await expect(createPasswordAccount(formData)).rejects.toThrow("redirect");

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
