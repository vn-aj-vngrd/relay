import { AuthApiError, createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getVerifiedAssuranceLevel } from "./assurance";

const userId = "00000000-0000-4000-8000-000000000001";

function createFixture({
  currentLevel = "aal1",
  storedFactors = false,
  verifiedFactors = true,
  rejected = false,
  missing = false,
}: {
  currentLevel?: string;
  storedFactors?: boolean;
  verifiedFactors?: boolean;
  rejected?: boolean;
  missing?: boolean;
} = {}) {
  const expiresAt = Math.floor(Date.now() / 1000) + 3600;
  const encode = (value: object) =>
    Buffer.from(JSON.stringify(value)).toString("base64url");
  const token = `${encode({ alg: "HS256", typ: "JWT" })}.${encode({
    sub: userId,
    exp: expiresAt,
    aal: currentLevel,
    amr: [{ method: "password", timestamp: 1 }],
  })}.${Buffer.from("test-signature").toString("base64url")}`;
  const factors = [{ id: "totp-1", factor_type: "totp", status: "verified" }];
  const stored = new Map<string, string>();
  if (!missing) {
    stored.set(
      "test-session",
      JSON.stringify({
        access_token: token,
        refresh_token: "test-refresh-token",
        expires_at: expiresAt,
        expires_in: 3600,
        token_type: "bearer",
        user: { id: userId, factors: storedFactors ? factors : [] },
      })
    );
  }
  const fetchUser = vi.fn(async () =>
    Response.json(
      rejected
        ? { msg: "Invalid JWT", code: "bad_jwt" }
        : { id: userId, factors: verifiedFactors ? factors : [] },
      { status: rejected ? 401 : 200 }
    )
  );
  const supabase = createClient("https://auth.example.com", "test-key", {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      storageKey: "test-session",
      storage: {
        isServer: true,
        getItem: (key) => stored.get(key) ?? null,
        setItem: (key, value) => {
          stored.set(key, value);
        },
        removeItem: (key) => {
          stored.delete(key);
        },
      },
    },
    global: { fetch: fetchUser },
  });
  return { supabase, fetchUser, token };
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe("getVerifiedAssuranceLevel", () => {
  it("uses Auth server factors even when the cookie omits MFA, without warning", async () => {
    const warning = vi.spyOn(console, "warn").mockImplementation(() => {});
    const { supabase, fetchUser, token } = createFixture();

    const result = await getVerifiedAssuranceLevel(supabase);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      currentLevel: "aal1",
      nextLevel: "aal2",
    });
    expect(fetchUser).toHaveBeenCalledWith(
      "https://auth.example.com/auth/v1/user",
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: `Bearer ${token}` }),
      })
    );
    expect(warning).not.toHaveBeenCalled();
  });

  it("ignores factors forged in cookie storage", async () => {
    const { supabase } = createFixture({
      storedFactors: true,
      verifiedFactors: false,
    });

    const result = await getVerifiedAssuranceLevel(supabase);

    expect(result.error).toBeNull();
    expect(result.data).toMatchObject({
      currentLevel: "aal1",
      nextLevel: "aal1",
    });
  });

  it("preserves a validated AAL2 session", async () => {
    const { supabase } = createFixture({ currentLevel: "aal2" });

    const result = await getVerifiedAssuranceLevel(supabase);

    expect(result.error).toBeNull();
    expect(result.data?.currentLevel).toBe("aal2");
  });

  it("does not trust a claimed AAL2 when Auth rejects the token", async () => {
    const { supabase } = createFixture({
      currentLevel: "aal2",
      rejected: true,
    });

    const result = await getVerifiedAssuranceLevel(supabase);

    expect(result.data).toBeNull();
    expect(result.error).toMatchObject({ status: 401 });
  });

  it("propagates session refresh failures without checking assurance", async () => {
    const { supabase } = createFixture({ missing: true });
    const error = new AuthApiError(
      "Refresh failed",
      400,
      "refresh_token_not_found"
    );
    vi.spyOn(supabase.auth, "getSession").mockResolvedValue({
      data: { session: null },
      error,
    });
    const assurance = vi.spyOn(
      supabase.auth.mfa,
      "getAuthenticatorAssuranceLevel"
    );

    expect(await getVerifiedAssuranceLevel(supabase)).toEqual({
      data: null,
      error,
    });
    expect(assurance).not.toHaveBeenCalled();
  });

  it("fails closed without a session and never uses the no-JWT fallback", async () => {
    const { supabase, fetchUser } = createFixture({ missing: true });
    const assurance = vi.spyOn(
      supabase.auth.mfa,
      "getAuthenticatorAssuranceLevel"
    );

    const result = await getVerifiedAssuranceLevel(supabase);

    expect(result.data).toBeNull();
    expect(result.error?.name).toBe("AuthSessionMissingError");
    expect(assurance).not.toHaveBeenCalled();
    expect(fetchUser).not.toHaveBeenCalled();
  });
});
