import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  hostedCount: vi.fn(),
  aggregateWhere: vi.fn(),
  recentWhere: vi.fn(),
  select: vi.fn(),
}));

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({
  db: { $count: mocks.hostedCount, select: mocks.select },
}));

import { getPlayerInsights } from "./insights";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.hostedCount.mockResolvedValue(2);
  mocks.select
    .mockImplementationOnce(() => ({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({ where: mocks.aggregateWhere }),
        }),
      }),
    }))
    .mockImplementationOnce(() => ({
      from: () => ({
        innerJoin: () => ({
          innerJoin: () => ({
            innerJoin: () => ({ where: mocks.recentWhere }),
          }),
        }),
      }),
    }));
  mocks.aggregateWhere.mockResolvedValue([
    {
      gamesPlayed: 3,
      matchesPlayed: 5,
      wins: 3,
      pointsFor: 52,
      pointsAgainst: 45,
    },
  ]);
  mocks.recentWhere.mockReturnValue({
    groupBy: () => ({
      orderBy: () => ({
        limit: async () => [
          { id: "game-1", title: "Friday play", matches: 2, wins: 1 },
        ],
      }),
    }),
  });
});

describe("player insights", () => {
  it("counts only this player's scored matches and derives the record", async () => {
    const insights = await getPlayerInsights("player-1");

    expect(insights).toMatchObject({
      hostedGames: 2,
      gamesPlayed: 3,
      matchesPlayed: 5,
      wins: 3,
      losses: 2,
      winRate: 60,
      pointsFor: 52,
      pointsAgainst: 45,
      recentGames: [{ id: "game-1", wins: 1, losses: 1 }],
    });
    const dialect = new PgDialect();
    const hosted = dialect.sqlToQuery(mocks.hostedCount.mock.calls[0][1]);
    expect(hosted.params).toEqual(["player-1", "completed"]);
    for (const where of [mocks.aggregateWhere, mocks.recentWhere]) {
      const query = dialect.sqlToQuery(where.mock.calls[0][0]);
      expect(query.params).toContain("player-1");
      expect(query.params).toContain("completed");
      expect(query.sql).toContain("winning_team");
      expect(query.sql).toContain("team_a_score");
      expect(query.sql).toContain("team_b_score");
    }
  });

  it("shows zero rather than an invented record when no match is scored", async () => {
    mocks.aggregateWhere.mockResolvedValueOnce([
      {
        gamesPlayed: 0,
        matchesPlayed: 0,
        wins: 0,
        pointsFor: 0,
        pointsAgainst: 0,
      },
    ]);
    mocks.recentWhere.mockReturnValueOnce({
      groupBy: () => ({ orderBy: () => ({ limit: async () => [] }) }),
    });

    expect(await getPlayerInsights("player-1")).toMatchObject({
      gamesPlayed: 0,
      matchesPlayed: 0,
      wins: 0,
      losses: 0,
      winRate: 0,
      recentGames: [],
    });
  });
});
