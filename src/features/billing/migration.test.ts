import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const migration = readFileSync(
  "drizzle/0051_personal_subscriptions.sql",
  "utf8"
);

describe("personal subscription migration security", () => {
  it("adds the session field selected by Home and locks legacy writes before backfill", () => {
    expect(migration).toContain(
      'ALTER TABLE "sessions" ADD COLUMN "participant_images_enabled" boolean DEFAULT true NOT NULL'
    );
    const lock =
      "LOCK TABLE public.users, public.sessions, public.messages, public.memories, public.memory_media IN SHARE ROW EXCLUSIVE MODE";
    expect(migration).toContain(lock);
    expect(migration.indexOf(lock)).toBeLessThan(
      migration.indexOf("INSERT INTO public.billing_game_usage")
    );
  });
  it.each([
    "billing_settings",
    "billing_methods",
    "billing_requests",
    "billing_terms",
    "billing_overrides",
    "billing_game_usage",
    "billing_media",
  ])("keeps %s server-only", (table) => {
    expect(migration).toContain(
      `ALTER TABLE public.${table} ENABLE ROW LEVEL SECURITY`
    );
    expect(migration).toMatch(
      /REVOKE ALL ON TABLE public\.billing_settings[\s\S]*FROM anon, authenticated, service_role;/
    );
  });
  it("creates private subscription files and does not enable sales", () => {
    expect(migration).toContain(
      "'subscription-files', 'subscription-files', false, 5242880"
    );
    expect(migration).toContain("VALUES ('global', false)");
    expect(migration).not.toMatch(/CREATE POLICY[\s\S]*subscription-files/);
  });
  it("retains existing creation usage and accounts for legacy stored media", () => {
    expect(migration).toContain(
      "SELECT host_id, id, id, created_at FROM public.sessions"
    );
    expect(migration).toContain("LEFT JOIN storage.objects");
    expect(migration).toContain("'memory', 'session-memories'");
    expect(migration).toContain("'chat', 'chat-images'");
  });
  it("records beta access as complimentary instead of a paid transaction", () => {
    expect(migration).toContain("SELECT id, 'complimentary', 'pro-v1'");
    expect(migration).not.toContain("INSERT INTO public.billing_requests");
  });
  it("deduplicates reminder delivery and checks for renewed access", () => {
    expect(migration).toContain("later.ends_at > t.ends_at");
    expect(migration).toContain("ON CONFLICT (dedupe_key) DO NOTHING");
  });
});
