import { describe, expect, it } from "vitest";

import { canContributeMemory } from "./permissions";

const completed = { hostId: "host-user", status: "completed" };

describe("memory contribution permissions", () => {
  it("allows the owner, co-hosts, and going account or guest players", () => {
    expect(
      canContributeMemory(completed, { userId: "host-user", player: null })
    ).toBe(true);
    expect(
      canContributeMemory(completed, {
        userId: "cohost-user",
        player: { role: "cohost", rsvp: "invited" },
      })
    ).toBe(true);
    expect(
      canContributeMemory(completed, {
        userId: null,
        player: { role: "player", rsvp: "going" },
      })
    ).toBe(true);
  });

  it("rejects incomplete games and nonparticipants", () => {
    expect(
      canContributeMemory(
        { ...completed, status: "live" },
        {
          userId: null,
          player: { role: "player", rsvp: "going" },
        }
      )
    ).toBe(false);
    expect(
      canContributeMemory(completed, {
        userId: "viewer",
        player: { role: "player", rsvp: "waitlisted" },
      })
    ).toBe(false);
    expect(canContributeMemory(completed, {})).toBe(false);
  });
});
