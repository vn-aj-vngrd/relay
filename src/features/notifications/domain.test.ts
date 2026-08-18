import { describe, expect, it } from "vitest";

import { notificationGroup, notificationPresentation } from "./domain";

describe("notificationPresentation", () => {
  it("routes join requests to roster management with useful guest context", () => {
    expect(
      notificationPresentation({
        type: "join_request",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: { guestName: "Mika" },
      }),
    ).toEqual({
      title: "New join request",
      body: "Mika wants to join Saturday Pickle.",
      href: "/games/session-1/players",
      tone: "players",
    });
  });

  it("routes payment and match work to the relevant session surface", () => {
    expect(
      notificationPresentation({
        type: "payment_confirmed",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {},
      }).href,
    ).toBe("/games/session-1/payments");
    expect(
      notificationPresentation({
        type: "match_assignment",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: { courtLabel: "Court 2" },
      }),
    ).toMatchObject({ body: "Head to Court 2 for your next match.", href: "/games/session-1/play", tone: "play" });
  });

  it("never links a removed player back into an inaccessible session", () => {
    expect(
      notificationPresentation({
        type: "removed_from_session",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {},
      }).href,
    ).toBe("/games");
  });
});

describe("notificationGroup", () => {
  const now = new Date("2026-08-17T06:00:00.000Z");

  it("groups notifications into today, this week, and earlier in Manila time", () => {
    expect(notificationGroup(new Date("2026-08-17T01:00:00.000Z"), now)).toBe("Today");
    expect(notificationGroup(new Date("2026-08-14T01:00:00.000Z"), now)).toBe("This week");
    expect(notificationGroup(new Date("2026-08-01T01:00:00.000Z"), now)).toBe("Earlier");
  });
});
