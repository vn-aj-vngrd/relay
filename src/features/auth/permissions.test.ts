import { describe, expect, it } from "vitest";

import { can, sessionActor } from "./permissions";

describe("session authorization", () => {
  it("keeps management server roles distinct from participation", () => {
    expect(can({ userId: "p", role: "player" }, "edit")).toBe(false);
    expect(can({ userId: "h", role: "host" }, "edit")).toBe(true);
    expect(can({ userId: "c", role: "cohost" }, "confirm_payment")).toBe(true);
    expect(can({ userId: "c", role: "cohost" }, "score")).toBe(true);
    expect(can({ userId: "c", role: "cohost" }, "create_expense")).toBe(false);
    expect(can({ userId: "c", role: "cohost" }, "complete")).toBe(false);
    expect(can({ userId: "c", role: "cohost" }, "delete")).toBe(false);
    expect(can({ userId: "h", role: "host" }, "create_expense")).toBe(true);
    expect(can({ userId: "h", role: "host" }, "delete")).toBe(true);
  });
  it("removes management authority when a co-host stops participating", () => {
    const active = sessionActor({
      userId: "c",
      hostId: "h",
      membership: { role: "cohost", rsvp: "going", leftAt: null },
    });
    const removed = sessionActor({
      userId: "c",
      hostId: "h",
      membership: { role: "cohost", rsvp: "declined", leftAt: new Date() },
    });
    expect(can(active, "confirm_payment")).toBe(true);
    expect(can(removed, "confirm_payment")).toBe(false);
  });

  it("allows scoped guests only self-service and contribution", () => {
    const guest = { guestPlayerId: "g" };
    expect(can(guest, "own_rsvp")).toBe(true);
    expect(can(guest, "manage_roster")).toBe(false);
    expect(can({ ...guest, assignedScorer: true }, "score")).toBe(false);
    expect(can(guest, "contribute", { participant: true })).toBe(true);
  });
});
