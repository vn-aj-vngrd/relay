import { describe, expect, it } from "vitest";
import { applyRsvp, cloneSession, findRosterIdentity, promoteWaitlist } from "./domain";

describe("session roster", () => {
  it("does not confuse a new guest with an authenticated player that has no guest token", () => {
    const roster = [{ id: "host", userId: "user-1", guestTokenHash: null }];
    expect(findRosterIdentity(roster, { userId: null, guestTokenHash: null })).toBeUndefined();
    expect(findRosterIdentity(roster, { guestTokenHash: "guest-hash" })).toBeUndefined();
  });
  it("waitlists a player when capacity is full", () => {
    const roster = [{ id: "a", rsvp: "going" as const }, { id: "b", rsvp: "going" as const }];
    expect(applyRsvp(roster, "c", "going", 2).find((p) => p.id === "c")).toEqual({ id: "c", rsvp: "waitlisted", waitlistPosition: 1 });
  });
  it("promotes the earliest waitlisted player and compacts ordering", () => {
    const roster = [{ id: "a", rsvp: "going" as const }, { id: "b", rsvp: "waitlisted" as const, waitlistPosition: 2 }, { id: "c", rsvp: "waitlisted" as const, waitlistPosition: 1 }];
    const result = promoteWaitlist(roster, 2);
    expect(result.find((p) => p.id === "c")?.rsvp).toBe("going");
    expect(result.find((p) => p.id === "b")?.waitlistPosition).toBe(1);
  });
});

describe("session cloning", () => {
  it("copies structure but not transactional session data", () => {
    const clone = cloneSession({ title: "Night pickle", venueId: "v", durationMinutes: 120, capacity: 8, courtCount: 2, commonInviteeIds: ["a"] });
    expect(clone).toEqual({ title: "Night pickle", venueId: "v", durationMinutes: 120, capacity: 8, courtCount: 2, suggestedInviteeIds: ["a"] });
    expect(clone).not.toHaveProperty("startsAt");
    expect(clone).not.toHaveProperty("payments");
  });
});
