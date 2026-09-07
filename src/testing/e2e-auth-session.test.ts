import type { BrowserContext } from "@playwright/test";
import type { CookieMethodsServer } from "@supabase/ssr";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getUserById: vi.fn(),
  generateLink: vi.fn(),
  verifyOtp: vi.fn(),
  createClient: vi.fn(),
  createServerClient: vi.fn(),
}));
vi.mock("@supabase/supabase-js", () => ({ createClient: mocks.createClient }));
vi.mock("@supabase/ssr", () => ({
  createServerClient: mocks.createServerClient,
}));

import { establishTestSession } from "../../e2e/helpers/auth";

const identity = {
  id: "fixture-id",
  email: "fixture@example.com",
  role: "authenticated",
  user_metadata: { test_account: true },
  app_metadata: {},
};
let adapter: CookieMethodsServer;
const cookies = vi.fn().mockResolvedValue([]);
const addCookies = vi.fn().mockResolvedValue(undefined);
const context = { cookies, addCookies } as unknown as BrowserContext;

beforeEach(() => {
  vi.clearAllMocks();
  for (const [key, value] of Object.entries({
    E2E_SESSION_FIXTURE: "true",
    E2E_AUTH_USER_ID: identity.id,
    E2E_AUTH_EMAIL: identity.email,
    SUPABASE_SECRET_KEY: "runner-secret",
    NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-key",
    ADMIN_EMAILS: "",
  }))
    vi.stubEnv(key, value);
  mocks.getUserById.mockResolvedValue({
    data: { user: identity },
    error: null,
  });
  mocks.generateLink.mockResolvedValue({
    data: {
      user: identity,
      properties: { hashed_token: "single-use-test-token" },
    },
    error: null,
  });
  mocks.createClient.mockReturnValue({
    auth: {
      admin: {
        getUserById: mocks.getUserById,
        generateLink: mocks.generateLink,
      },
    },
  });
  mocks.createServerClient.mockImplementation((_url, _key, options) => {
    adapter = options.cookies;
    return { auth: { verifyOtp: mocks.verifyOtp } };
  });
  mocks.verifyOtp.mockResolvedValue({
    data: { user: identity, session: {} },
    error: null,
  });
});
afterEach(() => vi.unstubAllEnvs());

describe("runner-only session establishment", () => {
  it("verifies the identity before generating and consuming a magic-link token in Node", async () => {
    await establishTestSession(context, "http://localhost:3002");
    expect(mocks.getUserById).toHaveBeenCalledWith(identity.id);
    expect(mocks.generateLink).toHaveBeenCalledWith({
      type: "magiclink",
      email: identity.email,
    });
    expect(mocks.verifyOtp).toHaveBeenCalledWith({
      type: "magiclink",
      token_hash: "single-use-test-token",
    });
    expect(mocks.createServerClient).toHaveBeenCalledWith(
      "https://fixture.supabase.co",
      "public-key",
      expect.any(Object)
    );
    expect(mocks.getUserById.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.generateLink.mock.invocationCallOrder[0]
    );
  });
  it("passes SSR-generated cookie chunks through the browser adapter without encoding tokens itself", async () => {
    await establishTestSession(context, "http://localhost:3002");
    await adapter.getAll();
    expect(cookies).toHaveBeenCalledWith("http://localhost:3002");
    await adapter.setAll?.(
      [
        {
          name: "sb-fixture-auth-token.0",
          value: "chunk-a",
          options: { path: "/", sameSite: "lax" },
        },
        {
          name: "sb-fixture-auth-token.1",
          value: "chunk-b",
          options: { path: "/", sameSite: "lax", maxAge: 0 },
        },
      ],
      {}
    );
    expect(addCookies).toHaveBeenCalledWith([
      expect.objectContaining({
        name: "sb-fixture-auth-token.0",
        value: "chunk-a",
        domain: "localhost",
        path: "/",
        sameSite: "Lax",
        secure: false,
      }),
      expect.objectContaining({
        name: "sb-fixture-auth-token.1",
        value: "chunk-b",
        expires: expect.any(Number),
      }),
    ]);
  });
  it("never generates tokens for an unmarked account", async () => {
    mocks.getUserById.mockResolvedValue({
      data: { user: { ...identity, user_metadata: {} } },
      error: null,
    });
    await expect(
      establishTestSession(context, "http://localhost:3002")
    ).rejects.toThrow(/refuses/);
    expect(mocks.generateLink).not.toHaveBeenCalled();
  });
  it("does not expose provider errors or tokens when session verification fails", async () => {
    mocks.verifyOtp.mockResolvedValue({
      data: {},
      error: { message: "sensitive provider detail" },
    });
    await expect(
      establishTestSession(context, "http://localhost:3002")
    ).rejects.toThrow("Could not establish the dedicated E2E session.");
  });
});
