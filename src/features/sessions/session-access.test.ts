import { describe, expect, it } from "vitest";

import { resolveSessionWorkspaceAccess } from "./session-access";

const activePublicGame = {
  userId: "viewer",
  hostId: "host",
  visibility: "public",
  status: "published",
  endsAt: new Date("2030-08-22T13:00:00.000Z"),
  estimatedCostCents: 0,
  membership: null,
  now: new Date("2030-08-22T10:00:00.000Z"),
};

describe("session workspace access", () => {
  it("keeps hosts, participants, invitees, and pending players in the authenticated workspace", () => {
    expect(
      resolveSessionWorkspaceAccess({ ...activePublicGame, userId: "host" })
    ).toBe("host");
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        membership: { role: "player", rsvp: "going" },
      })
    ).toBe("participant");
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        membership: { role: "player", rsvp: "invited" },
      })
    ).toBe("invited");
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        membership: { role: "player", rsvp: "pending" },
      })
    ).toBe("pending");
  });

  it("allows signed-in discovery only for active public games with a cost expectation", () => {
    expect(resolveSessionWorkspaceAccess(activePublicGame)).toBe("discoverer");
    expect(
      resolveSessionWorkspaceAccess({ ...activePublicGame, visibility: "link" })
    ).toBeNull();
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        visibility: "private",
      })
    ).toBeNull();
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        status: "completed",
      })
    ).toBeNull();
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        estimatedCostCents: null,
      })
    ).toBeNull();
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        now: new Date("2030-08-22T14:00:00.000Z"),
      })
    ).toBeNull();
  });

  it("keeps a declined public game readable but does not expose a declined private game", () => {
    const declined = { role: "player", rsvp: "declined" };
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        membership: declined,
      })
    ).toBe("discoverer");
    expect(
      resolveSessionWorkspaceAccess({
        ...activePublicGame,
        visibility: "private",
        membership: declined,
      })
    ).toBeNull();
  });
});
