import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ claims: vi.fn() }));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_SUPABASE_URL: "https://project.supabase.co",
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "test-key",
  }),
}));
vi.mock("@supabase/ssr", () => ({
  createServerClient: (
    _url: string,
    _key: string,
    options: {
      cookies: {
        setAll: (
          values: { name: string; value: string; options: { path: string } }[]
        ) => void;
      };
    }
  ) => ({
    auth: {
      getClaims: async () => {
        mocks.claims();
        options.cookies.setAll([
          {
            name: "refreshed-session",
            value: "new-token",
            options: { path: "/" },
          },
        ]);
        return { data: null };
      },
    },
  }),
}));

import { config, proxy } from "./proxy";

beforeEach(() => vi.clearAllMocks());
describe("Agent session refresh", () => {
  it.each(["/agent", "/api/agent"])(
    "persists refreshed cookies and strict CSP on %s",
    async (path) => {
      const response = await proxy(
        new NextRequest(`https://relay.test${path}`)
      );
      expect(mocks.claims).toHaveBeenCalledOnce();
      expect(response.cookies.get("refreshed-session")?.value).toBe(
        "new-token"
      );
      expect(response.headers.get("Content-Security-Policy")).toContain(
        "'nonce-"
      );
    }
  );
  it("routes Agent through the proxy matcher", () => {
    expect(config.matcher).toContain("/agent/:path*");
    expect(config.matcher).toContain("/api/:path*");
  });
});
