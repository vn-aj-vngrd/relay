import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

it("keeps the Agent message ledger outside the Supabase client Data API", () => {
  const migration = readFileSync(
    "drizzle/0057_agent_message_allowances.sql",
    "utf8"
  );
  expect(migration).toContain(
    'ALTER TABLE "agent_message_usage" ENABLE ROW LEVEL SECURITY'
  );
  expect(migration).toContain(
    'REVOKE ALL ON TABLE "agent_message_usage" FROM anon, authenticated, service_role'
  );
  expect(migration).not.toContain('"prompt"');
  expect(migration).not.toContain('"response"');
});

it("revokes every Data API role from saved conversations in a follow-up migration", () => {
  const migration = readFileSync(
    "drizzle/0061_agent_conversation_privileges.sql",
    "utf8"
  );
  const journal = JSON.parse(
    readFileSync("drizzle/meta/_journal.json", "utf8")
  ) as { entries: { idx: number; tag: string }[] };
  expect(migration).toContain(
    'REVOKE ALL ON TABLE "agent_conversations" FROM anon, authenticated, service_role;'
  );
  expect(journal.entries).toContainEqual(
    expect.objectContaining({
      idx: 61,
      tag: "0061_agent_conversation_privileges",
    })
  );
});

it("keeps creation disabled by default and its proposals outside the Data API", () => {
  const migration = readFileSync(
    "drizzle/0062_agent_creation_proposals.sql",
    "utf8"
  );
  expect(migration).toContain(
    "allow_game_creation boolean NOT NULL DEFAULT false"
  );
  expect(migration).toContain(
    "allow_group_creation boolean NOT NULL DEFAULT false"
  );
  expect(migration).toContain(
    "ALTER TABLE agent_creation_proposals ENABLE ROW LEVEL SECURITY"
  );
  expect(migration).toContain(
    "REVOKE ALL ON TABLE agent_creation_proposals FROM PUBLIC, anon, authenticated, service_role"
  );
});
