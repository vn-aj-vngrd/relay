import { describe, expect, it } from "vitest";
import { SESSION_REALTIME_TABLES } from "./realtime-tables";

describe("session realtime subscriptions", () => {
  it("only filters tables that carry a session_id column", () => {
    expect(SESSION_REALTIME_TABLES).toEqual(["courts", "matches", "session_queue", "messages"]);
    expect(SESSION_REALTIME_TABLES).not.toContain("message_reactions");
  });
});
