import { describe, expect, it } from "vitest";

import { encodeOpenGameCursor, openGamesFilterSchema, parseOpenGameCursor } from "./open-games";

describe("Open games request domain", () => {
  it("normalizes bounded discovery filters", () => {
    expect(openGamesFilterSchema.parse({ date: "7d", location: "  Cebu  ", available: "1" })).toEqual({
      date: "7d",
      location: "Cebu",
      available: true,
    });
    expect(openGamesFilterSchema.safeParse({ date: "forever", location: "", available: "" }).success).toBe(false);
    expect(openGamesFilterSchema.safeParse({ date: "any", location: "x".repeat(81), available: "" }).success).toBe(
      false,
    );
  });

  it("round-trips stable cursors and rejects forged cursors", () => {
    const cursor = { at: new Date("2030-08-22T11:00:00.000Z"), id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" };
    expect(parseOpenGameCursor(encodeOpenGameCursor(cursor))).toEqual(cursor);
    expect(parseOpenGameCursor("not-a-cursor")).toBeNull();
  });
});
