import { describe, expect, it } from "vitest";
import { defaultGameLibraryFilters } from "./game-library-filters";
import {
  encodeGameCursor,
  gameCursorContext,
  parseGameCursor,
} from "./game-pagination";

const cursor = {
  at: new Date("2026-08-29T12:00:00.000Z"),
  id: "3f50ee13-472f-4dc0-9e9b-df14470668ea",
};

describe("game pagination cursor", () => {
  it("round trips a stable game date and id", () => {
    expect(parseGameCursor(encodeGameCursor(cursor))).toEqual(cursor);
  });

  it("round trips the phase snapshot and binds pagination to account and filters", () => {
    const context = gameCursorContext(
      "account",
      "upcoming",
      "all",
      defaultGameLibraryFilters
    );
    const value = { ...cursor, snapshot: "2026-08-01T00:00:00.000Z", context };
    expect(parseGameCursor(encodeGameCursor(value))).toEqual(value);
    expect(
      gameCursorContext("other", "upcoming", "all", defaultGameLibraryFilters)
    ).not.toBe(context);
    expect(
      gameCursorContext("account", "past", "all", defaultGameLibraryFilters)
    ).not.toBe(context);
    expect(
      gameCursorContext("account", "upcoming", "all", {
        ...defaultGameLibraryFilters,
        role: "host",
      })
    ).not.toBe(context);
  });

  it("rejects malformed cursors", () => {
    expect(parseGameCursor("not-a-cursor")).toBeNull();
    expect(
      parseGameCursor(
        Buffer.from(JSON.stringify({ at: "yesterday", id: "no" })).toString(
          "base64url"
        )
      )
    ).toBeNull();
  });
});
