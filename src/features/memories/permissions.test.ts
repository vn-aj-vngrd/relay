import { describe, expect, it } from "vitest";

import { canContributeMemory } from "./permissions";

const completed = { hostId: "host-user", status: "completed" };

describe("memory contribution permissions", () => {
  it.each(["published", "live", "completed"])(
    "allows the owner, co-hosts and Going players during %s",
    (status) => {
      const completed = { hostId: "host-user", status };
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
    }
  );

  it("rejects drafts, cancelled games and nonparticipants", () => {
    expect(
      canContributeMemory(
        { ...completed, status: "draft" },
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
    expect(
      canContributeMemory(
        { ...completed, status: "cancelled" },
        { userId: "host-user" }
      )
    ).toBe(false);
  });
});
