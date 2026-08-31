import { describe, expect, it } from "vitest";

import {
  cloneSession,
  createSessionSchema,
  findRosterIdentity,
  sessionInviteeIds,
  updateSessionSchema,
} from "./domain";

describe("session validation", () => {
  const now = new Date("2029-12-31T16:00:00Z");
  const createSchema = createSessionSchema(now);
  const valid = {
    title: "Saturday Night Pickle",
    startsAt: new Date("2030-08-22T11:00:00Z"),
    endsAt: new Date("2030-08-22T14:00:00Z"),
    venueName: "Central Pickle",
    capacity: 8,
    courtCount: 2,
  };
  it("accepts the smallest complete session plan", () => expect(createSchema.safeParse(valid).success).toBe(true));
  it("defaults to violet and rejects colors outside the curated game palette", () => {
    expect(createSchema.parse(valid).accentColor).toBe("violet");
    expect(createSchema.safeParse({ ...valid, accentColor: "hot-pink" }).success).toBe(false);
  });
  it("rejects a start time that is not in the future", () => {
    const result = createSchema.safeParse({ ...valid, startsAt: now, endsAt: new Date(now.getTime() + 3600000) });
    expect(result.success ? [] : result.error.flatten().fieldErrors.startsAt).toContain(
      "Start time must be in the future.",
    );
  });
  it("rejects an end time before the start", () =>
    expect(createSchema.safeParse({ ...valid, endsAt: valid.startsAt }).success).toBe(false));
  it("accepts a larger court quantity without a four-court preset limit", () => {
    expect(createSchema.safeParse({ ...valid, courtCount: 20 }).success).toBe(true);
  });
  it("validates editable sharing and booking fields", () => {
    const update = {
      ...valid,
      sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
      version: 1,
      visibility: "link",
      requiresApproval: false,
      bookingReference: "CP-2048",
      bookingTotalCents: 240000,
    };
    expect(updateSessionSchema.safeParse(update).success).toBe(true);
    expect(updateSessionSchema.safeParse({ ...update, visibility: "friends" }).success).toBe(false);
  });
  it("returns clear boundaries for unsafe capacity and court quantities", () => {
    expect(createSchema.safeParse({ ...valid, capacity: 1 }).success).toBe(false);
    const tooFew = createSchema.safeParse({ ...valid, courtCount: 0 });
    const tooMany = createSchema.safeParse({ ...valid, courtCount: 21 });
    expect(tooFew.success ? [] : tooFew.error.flatten().fieldErrors.courtCount).toContain("Choose at least 1 court.");
    expect(tooMany.success ? [] : tooMany.error.flatten().fieldErrors.courtCount).toContain(
      "Relay supports up to 20 courts per session.",
    );
  });
});

describe("session roster", () => {
  it("does not confuse a new guest with an authenticated player that has no guest token", () => {
    const roster = [{ id: "host", userId: "user-1", guestTokenHash: null }];
    expect(findRosterIdentity(roster, { userId: null, guestTokenHash: null })).toBeUndefined();
    expect(findRosterIdentity(roster, { guestTokenHash: "guest-hash" })).toBeUndefined();
  });
});

describe("session cloning", () => {
  it("copies structure but not transactional session data", () => {
    const clone = cloneSession({
      title: "Night pickle",
      groupId: "g",
      venueId: "v",
      durationMinutes: 120,
      capacity: 8,
      courtCount: 2,
      commonInviteeIds: ["a"],
    });
    expect(clone).toEqual({
      title: "Night pickle",
      groupId: "g",
      venueId: "v",
      durationMinutes: 120,
      capacity: 8,
      courtCount: 2,
      suggestedInviteeIds: ["a"],
    });
    expect(clone).not.toHaveProperty("startsAt");
    expect(clone).not.toHaveProperty("payments");
  });

  it("invites the reusable crew without duplicating the host or copying RSVP state", () => {
    expect(sessionInviteeIds("host", ["host", "mika", "mika", null, "aj"])).toEqual(["mika", "aj"]);
  });
});
