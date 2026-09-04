import { describe, expect, it } from "vitest";

import { notificationGroup, notificationPresentation } from "./domain";

describe("notificationPresentation", () => {
  it("routes court suggestion outcomes to the player’s history", () => {
    expect(
      notificationPresentation({
        type: "court_suggestion_approved",
        sessionId: null,
        sessionTitle: null,
        payload: { body: "Central Pickle was updated." },
      })
    ).toEqual({
      title: "Court suggestion applied",
      body: "Central Pickle was updated.",
      href: "/court/suggest#your-suggestions",
      tone: "system",
    });
    expect(
      notificationPresentation({
        type: "court_suggestion_duplicate",
        sessionId: null,
        sessionTitle: null,
        payload: {},
      }).href
    ).toBe("/court/suggest#your-suggestions");
  });

  it("gives game invites enough context to respond confidently", () => {
    expect(
      notificationPresentation({
        type: "session_invite",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {
          hostName: "Mika Reyes",
          startsAt: "2026-08-22T11:00:00.000Z",
          venueName: "Central Pickle",
        },
      })
    ).toEqual({
      title: "You’re invited",
      body: "Mika Reyes invited you to Saturday Pickle on Sat, Aug 22 at Central Pickle.",
      href: "/games/session-1",
      tone: "session",
    });
  });

  it("routes join requests to roster management with useful guest context", () => {
    expect(
      notificationPresentation({
        type: "join_request",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: { guestName: "Mika" },
      })
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
      }).href
    ).toBe("/games/session-1/payments");
    expect(
      notificationPresentation({
        type: "match_assignment",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: { courtLabel: "Court 2" },
      })
    ).toMatchObject({
      body: "Head to Court 2 for your next match.",
      href: "/games/session-1/play",
      tone: "play",
    });
  });

  it("presents a cost change as a repayment-relevant update", () => {
    expect(
      notificationPresentation({
        type: "session_cost_changed",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {
          body: "Estimated cost updated from ₱300 per player to ₱400 per player.",
        },
      })
    ).toEqual({
      title: "Saturday Pickle cost updated",
      body: "Estimated cost updated from ₱300 per player to ₱400 per player.",
      href: "/games/session-1",
      tone: "payment",
    });
  });

  it("routes cancellations away from an inaccessible game", () => {
    expect(
      notificationPresentation({
        type: "session_cancelled",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {},
      })
    ).toEqual({
      title: "Saturday Pickle was cancelled",
      body: "The game is no longer going ahead. Open Relay to review your games.",
      href: "/games",
      tone: "session",
    });
  });

  it("routes scheduled reminders to the plan and arrival flow", () => {
    expect(
      notificationPresentation({
        type: "session_tomorrow",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {},
      }).href
    ).toBe("/games/session-1");
    expect(
      notificationPresentation({
        type: "session_starting_soon",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {},
      })
    ).toMatchObject({ href: "/games/session-1/play", tone: "play" });
  });

  it("opens a completed game at its recap", () => {
    expect(
      notificationPresentation({
        type: "session_completed",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {},
      })
    ).toMatchObject({ href: "/games/session-1/play", tone: "play" });
  });

  it("never links a removed player back into an inaccessible session", () => {
    expect(
      notificationPresentation({
        type: "removed_from_session",
        sessionId: "session-1",
        sessionTitle: "Saturday Pickle",
        payload: {},
      }).href
    ).toBe("/games");
  });
});

describe("notificationGroup", () => {
  const now = new Date("2026-08-17T06:00:00.000Z");

  it("groups notifications into today, this week, and earlier in Manila time", () => {
    expect(notificationGroup(new Date("2026-08-17T01:00:00.000Z"), now)).toBe(
      "Today"
    );
    expect(notificationGroup(new Date("2026-08-14T01:00:00.000Z"), now)).toBe(
      "This week"
    );
    expect(notificationGroup(new Date("2026-08-01T01:00:00.000Z"), now)).toBe(
      "Earlier"
    );
  });
});
