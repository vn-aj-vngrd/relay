import { expect, it } from "vitest";
import { chatAge } from "./history-age";

const now = Date.parse("2026-09-15T12:00:00Z");
it.each([
  [0, "Just now"],
  [59, "Just now"],
  [60, "1m"],
  [3599, "59m"],
  [3600, "1h"],
  [86399, "23h"],
  [86400, "1d"],
  [7 * 86400, "1w"],
  [30 * 86400, "1mo"],
  [365 * 86400, "1y"],
  [3 * 365 * 86400, "3y"],
])("formats %s seconds of elapsed time as %s", (seconds, expected) => {
  expect(
    chatAge(new Date(now - Number(seconds) * 1000).toISOString(), now)
  ).toBe(expected);
});
it("uses readable labels and handles future or invalid dates", () => {
  expect(chatAge(new Date(now - 7200000).toISOString(), now, true)).toBe(
    "2 hours ago"
  );
  expect(chatAge(new Date(now - 60000).toISOString(), now, true)).toBe(
    "1 minute ago"
  );
  expect(chatAge(new Date(now + 1000).toISOString(), now)).toBe("Just now");
  expect(chatAge("invalid", now)).toBe("Unknown");
});
