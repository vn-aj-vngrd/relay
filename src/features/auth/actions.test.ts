import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  redirect: vi.fn(() => {
    throw new Error("redirect");
  }),
  signUp: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("next/headers", () => ({ cookies: vi.fn(async () => ({ delete: vi.fn(), get: vi.fn(), set: vi.fn() })) }));
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
  createSupabaseServerClient: vi.fn(async () => ({ auth: { signUp: mocks.signUp } })),
}));
vi.mock("./destination", () => ({ resolvePostAuthDestination: vi.fn() }));
vi.mock("./session", () => ({ getCurrentUser: vi.fn() }));

import { createPasswordAccount } from "./actions";

beforeEach(() => {
  mocks.redirect.mockClear();
  mocks.signUp.mockReset();
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
  });
});
