import { describe, expect, it } from "vitest";

import { buildCalendarDays, shiftDateKey } from "./games-calendar";

describe("games calendar dates", () => {
  it("builds a stable six-week Sunday-first month grid", () => {
    const days = buildCalendarDays("2026-08", "sunday");

    expect(days).toHaveLength(42);
    expect(days[0]).toEqual({ dateKey: "2026-07-26", day: 26, inMonth: false });
    expect(days[6]).toEqual({ dateKey: "2026-08-01", day: 1, inMonth: true });
    expect(days.at(-1)).toEqual({ dateKey: "2026-09-05", day: 5, inMonth: false });
  });

  it("honors Monday-first preferences", () => {
    const days = buildCalendarDays("2026-08", "monday");

    expect(days[0]?.dateKey).toBe("2026-07-27");
    expect(days[5]?.dateKey).toBe("2026-08-01");
  });

  it("moves keyboard selection safely across months and years", () => {
    expect(shiftDateKey("2026-08-01", -1)).toBe("2026-07-31");
    expect(shiftDateKey("2026-12-31", 1)).toBe("2027-01-01");
  });
});
