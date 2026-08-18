import { describe, expect, it } from "vitest";

import { can } from "./permissions";

describe("session authorization", () => {
  it("keeps management server roles distinct from participation", () => {
    expect(can({ userId: "p", role: "player" }, "edit")).toBe(false);
    expect(can({ userId: "h", role: "host" }, "edit")).toBe(true);
    expect(can({ userId: "c", role: "cohost" }, "complete")).toBe(false);
    expect(can({ userId: "c", role: "cohost" }, "delete")).toBe(false);
    expect(can({ userId: "h", role: "host" }, "delete")).toBe(true);
  });
  it("allows scoped guests only self-service and contribution", () => {
    const guest = { guestPlayerId: "g" };
    expect(can(guest, "own_rsvp")).toBe(true);
    expect(can(guest, "manage_roster")).toBe(false);
    expect(can(guest, "contribute", { participant: true })).toBe(true);
  });
});
