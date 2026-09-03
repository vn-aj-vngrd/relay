import { describe, expect, it } from "vitest";

import {
  channelAllowsNotification,
  channelSupportsCategory,
  defaultCategoryPreferences,
  isWithinQuietHours,
  notificationCategory,
  reminderTimingEnabled,
} from "./preferences";

describe("notification delivery preferences", () => {
  it("uses one category policy across email and push", () => {
    expect(notificationCategory("moved_from_waitlist")).toBe("roster");
    expect(channelAllowsNotification("email", "moved_from_waitlist")).toBe(
      true
    );
    expect(channelAllowsNotification("email", "session_starting_soon")).toBe(
      false
    );
    expect(channelAllowsNotification("push", "session_starting_soon")).toBe(
      true
    );
    expect(channelSupportsCategory("email", "payments")).toBe(false);
    expect(channelSupportsCategory("push", "payments")).toBe(true);
    expect(defaultCategoryPreferences.payments).toBe(true);
  });

  it("honors each reminder timing choice", () => {
    expect(reminderTimingEnabled("session_tomorrow", false, true)).toBe(false);
    expect(reminderTimingEnabled("session_starting_soon", true, false)).toBe(
      false
    );
    expect(reminderTimingEnabled("session_invite", false, false)).toBe(true);
  });

  it("handles quiet hours that cross midnight in the user’s time zone", () => {
    const atElevenPmManila = new Date("2026-09-03T15:00:00Z");
    const atNoonManila = new Date("2026-09-03T04:00:00Z");
    expect(
      isWithinQuietHours(atElevenPmManila, "Asia/Manila", "22:00", "07:00")
    ).toBe(true);
    expect(
      isWithinQuietHours(atNoonManila, "Asia/Manila", "22:00", "07:00")
    ).toBe(false);
  });
});
