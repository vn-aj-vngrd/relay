import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  membership: vi.fn(),
  session: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({
  db: {
    select: mocks.select,
    query: { sessionPlayers: { findFirst: mocks.membership } },
  },
}));
vi.mock("@/features/sessions/queries", () => ({
  getPublicSession: mocks.session,
  getSessionForParticipant: mocks.session,
  getSessionForWorkspace: mocks.session,
}));

import {
  getCompactPersonalPlayStatus,
  getPublicLiveSession,
  getWorkspaceLiveSession,
} from "./queries";

function queryRows(rows: unknown[]) {
  const result = Promise.resolve(rows);
  const chain = () => result;
  return Object.assign(result, {
    from: chain,
    where: chain,
    orderBy: chain,
    innerJoin: chain,
    leftJoin: chain,
    limit: chain,
  });
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.session.mockResolvedValue({
    session: { id: "session-1", rotationMode: "queue" },
  });
});

describe("retired court labels", () => {
  it.each(["shared", "workspace"])(
    "uses court positions instead of old snapshots on %s Play",
    async (surface) => {
      const legacyMatch = {
        id: "match-1",
        courtId: "court-3",
        courtLabel: "Court labels etc",
        status: "active",
        startedAt: new Date("2026-09-05T07:00:00Z"),
        finishedAt: null,
        teamAScore: 7,
        teamBScore: 5,
        version: 4,
      };
      mocks.select
        .mockReturnValueOnce(
          queryRows([
            {
              id: "court-3",
              label: "Another retired name",
              position: 3,
              availableForPlay: false,
            },
          ])
        )
        .mockReturnValueOnce(
          queryRows([
            legacyMatch,
            { ...legacyMatch, id: "orphan", courtId: null },
            { ...legacyMatch, id: "completed", status: "completed" },
          ])
        )
        .mockReturnValueOnce(queryRows([]))
        .mockReturnValueOnce(queryRows([]))
        .mockReturnValueOnce(queryRows([]));

      const data =
        surface === "shared"
          ? await getPublicLiveSession("slug")
          : await getWorkspaceLiveSession("session-1", "user-1");

      expect(data?.courts[0]).toMatchObject({
        label: "Court 3",
        availableForPlay: false,
      });
      expect(data?.activeMatches[0]).toMatchObject({
        ...legacyMatch,
        courtLabel: "Court 3",
      });
      expect(data?.activeMatches[1].courtLabel).toBe("Court");
      expect(data?.completedMatches[0].courtLabel).toBe("Court 3");
      expect(legacyMatch.courtLabel).toBe("Court labels etc");
    }
  );

  it("uses the same numbered name outside Play", async () => {
    mocks.membership.mockResolvedValue({ id: "player-1", rsvp: "going" });
    mocks.select.mockReturnValueOnce(queryRows([{ courtPosition: 3 }]));

    await expect(
      getCompactPersonalPlayStatus("session-1", "user-1")
    ).resolves.toEqual({ label: "Playing now · Court 3", urgent: true });
  });
});
