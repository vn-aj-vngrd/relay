import type { User } from "@supabase/supabase-js";
import { describe, expect, it } from "vitest";

import { assertDisposableUser, fixtureConfig } from "../../e2e/helpers/auth";

const env = {
  E2E_SESSION_FIXTURE: "true",
  E2E_AUTH_USER_ID: "dedicated-user-id",
  E2E_AUTH_EMAIL: "fixture@example.com",
  SUPABASE_SECRET_KEY: "runner-only-test-secret",
  NEXT_PUBLIC_SUPABASE_URL: "https://fixture.supabase.co",
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: "public-test-key",
};
const config = fixtureConfig(env, "http://localhost:3002");
const user = {
  id: env.E2E_AUTH_USER_ID,
  email: env.E2E_AUTH_EMAIL,
  role: "authenticated",
  aud: "authenticated",
  created_at: "2026-01-01T00:00:00Z",
  user_metadata: { test_account: true },
  app_metadata: {},
} as User;

describe("trusted E2E fixture boundaries", () => {
  it("requires explicit opt-in before admin credentials can be used", () => {
    expect(() =>
      fixtureConfig(
        { ...env, E2E_SESSION_FIXTURE: undefined },
        "http://localhost:3002"
      )
    ).toThrow(/authorize/);
  });
  it.each([
    "https://relay.example.com",
    "http://localhost.evil.example",
    "file:///tmp/fixture",
    "http://192.168.1.2:3002",
  ])("refuses non-loopback target %s", (origin) => {
    expect(() => fixtureConfig(env, origin)).toThrow(/loopback/);
  });
  it.each([
    "http://localhost:3002",
    "http://127.0.0.1:3002",
    "http://[::1]:3002",
  ])("permits explicit loopback target %s", (origin) => {
    expect(fixtureConfig(env, origin).origin).toBe(origin);
  });
  it.each([
    "E2E_AUTH_USER_ID",
    "E2E_AUTH_EMAIL",
    "SUPABASE_SECRET_KEY",
    "NEXT_PUBLIC_SUPABASE_URL",
    "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY",
  ])("requires %s", (key) => {
    expect(() =>
      fixtureConfig({ ...env, [key]: "" }, "http://localhost:3002")
    ).toThrow(`Missing ${key}`);
  });
  it("accepts only the pinned, explicitly marked normal account", () => {
    expect(() => assertDisposableUser(user, config)).not.toThrow();
  });
  it.each([
    { id: "different-user" },
    { email: "different@example.com" },
    { user_metadata: {} },
    { user_metadata: { test_account: "true" } },
    { role: "service_role" },
    { app_metadata: { role: "admin" } },
    { app_metadata: { is_admin: true } },
    { factors: [{ id: "factor" }] },
  ])("refuses mismatched/unmarked/privileged account %j", (change) => {
    expect(() =>
      assertDisposableUser({ ...user, ...change } as User, config)
    ).toThrow(/refuses/);
  });
  it("refuses an allowlisted Relay admin case-insensitively", () => {
    const adminConfig = fixtureConfig(
      { ...env, ADMIN_EMAILS: "other@example.com, FIXTURE@example.com " },
      "http://localhost:3002"
    );
    expect(() => assertDisposableUser(user, adminConfig)).toThrow(/privileged/);
  });
});
