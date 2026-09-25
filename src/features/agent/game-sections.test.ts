import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  workspace: vi.fn(),
  live: vi.fn(),
  recap: vi.fn(),
  query: vi.fn(),
}));
vi.mock("./reads", () => ({ getAgentGameWorkspace: mocks.workspace }));
vi.mock("@/features/matches/queries", () => ({
  getWorkspaceLiveSession: mocks.live,
}));
vi.mock("@/features/memories/queries", () => ({
  getSessionRecapData: mocks.recap,
}));
vi.mock("@/db/client", async () => {
  const { drizzle } = await import("drizzle-orm/pg-proxy");
  return { db: drizzle(mocks.query) };
});

import { readAgentGameSection } from "./game-sections";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.query.mockResolvedValue({ rows: [] });
  mocks.workspace.mockResolvedValue({
    session: { id: "game", hostId: "host" },
    access: "participant",
    membership: { role: "player", rsvp: "going", leftAt: null },
  });
});

describe("Agent game sections", () => {
  it.each(["play", "recap", "payments", "chat", "story"] as const)(
    "rejects unauthorized %s before any section reads",
    async (section) => {
      mocks.workspace.mockResolvedValue(null);
      expect(
        await readAgentGameSection("outsider", "game", section, 0)
      ).toEqual({ unavailable: true });
      expect(mocks.query).not.toHaveBeenCalled();
      expect(mocks.live).not.toHaveBeenCalled();
      expect(mocks.recap).not.toHaveBeenCalled();
    }
  );
  it.each(["invited", "pending", "discoverer"])(
    "does not disclose payments to %s viewers",
    async (access) => {
      mocks.workspace.mockResolvedValue({ access });
      expect(
        await readAgentGameSection("viewer", "game", "payments", 0)
      ).toEqual({ unavailable: true });
      expect(mocks.query).not.toHaveBeenCalled();
    }
  );
  it("restricts payment rows to the participant and omits financial credentials", async () => {
    const result = await readAgentGameSection("viewer", "game", "payments", 0);
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(parameters).toContain("viewer");
    expect(parameters).toContain("host");
    expect(query).not.toContain("proof_storage_path");
    expect(query).not.toContain("payment_accounts");
    expect(result).toMatchObject({
      audience: "own payments",
      href: "/games/game/payments",
    });
  });
  it.each(["host", "cohost"])("permits %s payment oversight", async (role) => {
    mocks.workspace.mockResolvedValue({
      session: { id: "game", hostId: "host" },
      access: role,
      membership: { role, rsvp: "going", leftAt: null },
    });
    const result = await readAgentGameSection(
      "organizer",
      "game",
      "payments",
      0
    );
    expect(result).toMatchObject({ audience: "organizer" });
    expect(mocks.query.mock.calls[0][1]).not.toContain("organizer");
  });
  it("projects recorded play facts without raw players or account identifiers", async () => {
    mocks.live.mockResolvedValue({
      completedMatchCount: 1,
      courts: [
        { label: "Court 1", availableForPlay: true, internal: "SECRET" },
      ],
      activeMatches: [],
      completedMatches: [
        {
          courtLabel: "Court 1",
          teams: ["Alex", "Sam"],
          scores: [11, 7],
          winningTeam: "A",
          version: "SECRET",
        },
      ],
      standings: [{ name: "Alex", wins: 1, playerId: "SECRET" }],
      queue: [
        {
          queue: { position: 1, state: "waiting" },
          player: { guestTokenHash: "SECRET" },
          profile: { name: "Sam", email: "SECRET" },
        },
      ],
    });
    const result = await readAgentGameSection("viewer", "game", "play", 0);
    expect(result).toMatchObject({
      completedMatchCount: 1,
      results: { items: [{ scores: [11, 7] }] },
    });
    expect(JSON.stringify(result)).not.toContain("SECRET");
    expect(mocks.live).toHaveBeenCalledWith("game", "viewer");
  });
  it("paginates chat newest first and returns no storage paths", async () => {
    mocks.query.mockResolvedValue({
      rows: Array.from({ length: 21 }, () => [
        "Alex",
        "See you there",
        "text",
        new Date().toISOString(),
        false,
      ]),
    });
    const result = await readAgentGameSection("viewer", "game", "chat", 20);
    expect(result).toMatchObject({
      messages: { truncated: true, nextOffset: 40 },
    });
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"messages"."created_at" desc');
    expect(parameters).toContain(20);
    expect(query).not.toContain('"messages"."image_path",');
  });
  it("reads Story captions without signing or exposing media URLs", async () => {
    await readAgentGameSection("viewer", "game", "story", 0);
    const [query, parameters] = mocks.query.mock.calls[0];
    expect(query).toContain('"memory_media"."caption"');
    expect(query).not.toContain("storage_path");
    expect(parameters).toContain("game");
  });
});

it("reuses factual recap totals and does not expose player IDs", async () => {
  mocks.recap.mockResolvedValue({
    matchCount: 0,
    totalPoints: 0,
    playMinutes: 0,
    busiestCourt: null,
    closestMatch: null,
    standout: null,
    topPair: null,
    results: [],
    standings: [],
  });
  expect(
    await readAgentGameSection("viewer", "game", "recap", 0)
  ).toMatchObject({
    href: "/games/game/play",
    matchCount: 0,
    results: { items: [] },
    standout: null,
  });
  expect(mocks.recap).toHaveBeenCalledWith("game");
});
