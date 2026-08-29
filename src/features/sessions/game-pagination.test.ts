import { describe, expect, it } from "vitest";

import { encodeGameCursor, parseGameCursor } from "./game-pagination";

const cursor = {
  at: new Date("2026-08-29T12:00:00.000Z"),
  id: "3f50ee13-472f-4dc0-9e9b-df14470668ea",
};

describe("game pagination cursor", () => {
  it("round trips a stable game date and id", () => {
    expect(parseGameCursor(encodeGameCursor(cursor))).toEqual(cursor);
  });

  it("rejects malformed cursors", () => {
    expect(parseGameCursor("not-a-cursor")).toBeNull();
    expect(
      parseGameCursor(Buffer.from(JSON.stringify({ at: "yesterday", id: "no" })).toString("base64url")),
    ).toBeNull();
  });
});
