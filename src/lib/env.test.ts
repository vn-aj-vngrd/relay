import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { getPublicEnv, getServerEnv } from "./env";

beforeEach(() => {
  vi.stubEnv("NEXT_PUBLIC_APP_URL", "https://relay.example.com");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
  vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "sb_publishable_test");
  vi.stubEnv("NEXT_PUBLIC_GOOGLE_AUTH_ENABLED", "true");
  vi.stubEnv("DATABASE_URL", "postgresql://relay:password@localhost:5432/relay");
  vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_test");
  vi.stubEnv("GEOAPIFY_API_KEY", "geoapify-test-key-long-enough");
});

afterEach(() => vi.unstubAllEnvs());

describe("environment parsing", () => {
  it("keeps the public Google flag valid when public values are reused by the server schema", () => {
    expect(getPublicEnv().NEXT_PUBLIC_GOOGLE_AUTH_ENABLED).toBe(true);
    expect(getServerEnv().NEXT_PUBLIC_GOOGLE_AUTH_ENABLED).toBe(true);
  });
});
