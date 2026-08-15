import { describe, expect, it } from "vitest";
import { formatSessionDate, formatSessionDateLong, formatSessionTime, peso } from "./format";

describe("session formatting", () => {
  const start = new Date("2026-08-22T11:00:00Z");
  const end = new Date("2026-08-22T14:00:00Z");
  it("formats plans in the session timezone", () => {
    expect(formatSessionDate(start)).toBe("Sat, Aug 22");
    expect(formatSessionDateLong(start)).toBe("Saturday, August 22");
    expect(formatSessionTime(start, end)).toBe("7:00 PM–10:00 PM");
  });
  it("formats Philippine peso amounts from integer cents", () => {
    expect(peso(30000)).toContain("300");
    expect(peso(null)).toBeNull();
  });
});
