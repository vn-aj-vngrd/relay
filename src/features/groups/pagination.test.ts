import { describe, expect, it } from "vitest";

import { encodeGroupCursor, parseGroupCursor } from "./pagination";

const cursor = { at: new Date("2026-08-31T00:00:00.000Z"), id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" };

describe("group cursor", () => {
  it("round trips a stable date and id", () => {
    expect(parseGroupCursor(encodeGroupCursor(cursor))).toEqual(cursor);
  });

  it("rejects malformed cursors", () => {
    expect(parseGroupCursor("not-a-cursor")).toBeNull();
  });
});
