import { describe, expect, it } from "vitest";

import {
  encodeNotificationCursor,
  parseNotificationCursor,
} from "./pagination";

const cursor = {
  at: new Date("2026-08-31T00:00:00.000Z"),
  id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
};

describe("notification cursor", () => {
  it("round trips a stable date and id", () => {
    expect(parseNotificationCursor(encodeNotificationCursor(cursor))).toEqual(
      cursor
    );
  });

  it("rejects malformed cursors", () => {
    expect(parseNotificationCursor("not-a-cursor")).toBeNull();
  });
});
