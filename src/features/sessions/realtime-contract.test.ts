import { readFileSync } from "node:fs";
import { resolve } from "node:path";

import { describe, expect, it } from "vitest";

const migration = readFileSync(resolve(process.cwd(), "drizzle/0016_session_recap_balanced_realtime.sql"), "utf8");

const collaborativeTables = [
  "sessions",
  "session_players",
  "courts",
  "expenses",
  "player_payments",
  "matches",
  "match_players",
  "match_scores",
  "session_queue",
  "session_pairs",
  "session_pair_members",
  "messages",
  "message_reactions",
  "memories",
  "memory_media",
  "comments",
  "reactions",
];

describe("session realtime contract", () => {
  it.each(collaborativeTables)("broadcasts %s changes through the session topic", (table) => {
    expect(migration).toContain(`'${table}'`);
  });

  it("broadcasts invalidations without exposing changed row content", () => {
    expect(migration).toContain("jsonb_build_object('table', TG_TABLE_NAME, 'operation', TG_OP)");
    expect(migration).toContain("'session:' || affected_session_id::text");
  });
});
