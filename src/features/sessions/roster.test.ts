import { describe, expect, it } from "vitest";

import { planRosterTransition } from "./roster";

const player = (
  id: string,
  rsvp: "invited" | "pending" | "going" | "maybe" | "waitlisted" | "declined",
  waitlistPosition: number | null = null,
) => ({ id, rsvp, waitlistPosition });

describe("roster transitions", () => {
  it("waitlists a new player when the session is full", () => {
    const transition = planRosterTransition({
      roster: [player("a", "going"), player("b", "going")],
      capacity: 2,
      intent: { requested: "going" },
    });

    expect(transition.target).toEqual({
      rsvp: "waitlisted",
      waitlistPosition: 1,
      playState: "unavailable",
    });
  });

  it("keeps approval ahead of capacity decisions", () => {
    const transition = planRosterTransition({
      roster: [player("a", "going"), player("b", "going")],
      capacity: 2,
      intent: { requested: "going", requiresApproval: true },
    });

    expect(transition.target.rsvp).toBe("pending");
  });

  it("approves a pending player into the earliest open place", () => {
    const transition = planRosterTransition({
      roster: [player("a", "going"), player("pending", "pending")],
      capacity: 2,
      intent: { playerId: "pending", requested: "going" },
    });

    expect(transition.target).toEqual({ rsvp: "going", waitlistPosition: null, playState: "waiting" });
  });

  it("promotes the earliest waitlisted player and compacts the waitlist when a player leaves", () => {
    const transition = planRosterTransition({
      roster: [player("leaving", "going"), player("later", "waitlisted", 2), player("next", "waitlisted", 1)],
      capacity: 2,
      intent: { playerId: "leaving", requested: "declined" },
    });

    expect(transition.promotedPlayerIds).toEqual(["next"]);
    expect(transition.updates).toEqual(
      expect.arrayContaining([
        { id: "leaving", rsvp: "declined", waitlistPosition: null, playState: "unavailable" },
        { id: "next", rsvp: "going", waitlistPosition: null, playState: "waiting" },
        { id: "later", rsvp: "waitlisted", waitlistPosition: 1, playState: "unavailable" },
      ]),
    );
  });

  it("preserves a waitlisted player's place when they ask to go again", () => {
    const transition = planRosterTransition({
      roster: [player("a", "going"), player("b", "going"), player("waiting", "waitlisted", 1)],
      capacity: 2,
      intent: { playerId: "waiting", requested: "going", requiresApproval: true },
    });

    expect(transition.target).toEqual({
      rsvp: "waitlisted",
      waitlistPosition: 1,
      playState: "unavailable",
    });
  });
});
