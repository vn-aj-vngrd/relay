import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  member: vi.fn(),
  workspace: vi.fn(),
}));
vi.mock("@/db/client", () => ({
  db: {
    query: {
      sessions: { findFirst: mocks.session },
      sessionPlayers: { findFirst: mocks.member },
    },
  },
}));
vi.mock("@/features/sessions/queries", () => ({
  getSessionForWorkspace: mocks.workspace,
}));

import { readAgentGame } from "./reads";

const session = {
  id: "game",
  hostId: "host",
  visibility: "private",
  status: "published",
  endsAt: new Date("2030-01-01"),
  playerPriceCents: 0,
  title: "Game",
  notes: "CONFIDENTIAL",
  rotationConfig: { secret: "INTERNAL" },
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue(session);
  mocks.member.mockResolvedValue(undefined);
});
describe("Agent record authorization and projections", () => {
  it("does not use workspace/roster access for another user's private game", async () => {
    expect(await readAgentGame("stranger", "game")).toEqual({
      unavailable: true,
    });
    expect(mocks.workspace).not.toHaveBeenCalled();
  });
  it("rejects removed memberships including stale cohosts", async () => {
    mocks.member.mockResolvedValue({
      role: "cohost",
      rsvp: "going",
      leftAt: new Date(),
    });
    expect(await readAgentGame("former-cohost", "game")).toEqual({
      unavailable: true,
    });
    expect(mocks.workspace).not.toHaveBeenCalled();
  });
  it("treats missing records identically to forbidden records", async () => {
    mocks.session.mockResolvedValue(undefined);
    expect(await readAgentGame("stranger", "missing")).toEqual({
      unavailable: true,
    });
  });
  it("passes the server-bound identity and returns only approved fields", async () => {
    mocks.workspace.mockResolvedValue({
      session,
      access: "host",
      membership: { secret: "MEMBERSHIP" },
      roster: [
        {
          player: {
            guestName: "Player",
            rsvp: "going",
            role: "player",
            guestTokenHash: "TOKEN",
            leftAt: null,
          },
          profile: {
            name: "Alex",
            email: "PRIVATE_EMAIL",
            userId: "PRIVATE_ID",
          },
        },
        { player: { guestName: "Removed", leftAt: new Date() }, profile: null },
      ],
    });
    const result = await readAgentGame("host", "game");
    expect(mocks.workspace).toHaveBeenCalledWith("game", "host");
    expect(result).toHaveProperty("players", [
      { name: "Alex", rsvp: "going", role: "player" },
    ]);
    for (const forbidden of [
      "CONFIDENTIAL",
      "INTERNAL",
      "MEMBERSHIP",
      "TOKEN",
      "PRIVATE_EMAIL",
      "PRIVATE_ID",
      "Removed",
    ])
      expect(JSON.stringify(result)).not.toContain(forbidden);
  });
  it("keeps pending and invited names organizer-only", async () => {
    mocks.member.mockResolvedValue({
      role: "player",
      rsvp: "going",
      leftAt: null,
    });
    mocks.workspace.mockResolvedValue({
      session,
      access: "participant",
      roster: [
        {
          player: { guestName: "Visible", rsvp: "going", role: "player" },
          profile: null,
        },
        {
          player: {
            guestName: "PRIVATE_PENDING",
            rsvp: "pending",
            role: "player",
          },
          profile: null,
        },
        {
          player: {
            guestName: "PRIVATE_INVITED",
            rsvp: "invited",
            role: "player",
          },
          profile: null,
        },
      ],
    });
    const result = await readAgentGame("participant", "game");
    expect(result).toHaveProperty("players", [
      { name: "Visible", rsvp: "going", role: "player" },
    ]);
  });
  it("keeps restricted roster visibility delegated to workspace permissions", async () => {
    mocks.session.mockResolvedValue({ ...session, visibility: "public" });
    mocks.workspace.mockResolvedValue(null);
    expect(await readAgentGame("discoverer", "game")).toEqual({
      unavailable: true,
    });
    expect(mocks.workspace).toHaveBeenCalledWith("game", "discoverer");
  });
});
