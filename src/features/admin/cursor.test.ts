import { describe, expect, it } from "vitest";

import { encodeAdminCursor, parseAdminCursor } from "./cursor";

const cursor = {
  at: new Date("2026-08-19T09:30:00.000Z"),
  id: "3f50ee13-472f-4dc0-9e9b-df14470668ea",
};

describe("admin cursor", () => {
  it("round trips a stable date and id cursor", () => {
    expect(parseAdminCursor(encodeAdminCursor(cursor))).toEqual(cursor);
  });

  it("rejects malformed and type-invalid cursors", () => {
    expect(parseAdminCursor("not-base64-json")).toBeNull();
    expect(
      parseAdminCursor(Buffer.from(JSON.stringify({ at: "yesterday", id: "1" })).toString("base64url")),
    ).toBeNull();
  });
});
