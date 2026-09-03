import { describe, expect, it } from "vitest";

import { roundTimeRemaining } from "./round-timer";

describe("round timer", () => {
  it("derives remaining time from persisted match start time", () => {
    const start = "2026-08-19T11:00:00.000Z";
    expect(
      roundTimeRemaining(
        start,
        12,
        new Date("2026-08-19T11:05:30.000Z").getTime()
      )
    ).toBe(390_000);
  });

  it("never returns negative time after the round ends", () => {
    const start = "2026-08-19T11:00:00.000Z";
    expect(
      roundTimeRemaining(
        start,
        10,
        new Date("2026-08-19T11:12:00.000Z").getTime()
      )
    ).toBe(0);
  });
});
