import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ where: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({
  db: {
    select: () => ({
      from: () => ({
        leftJoin: () => ({
          where: mocks.where,
        }),
      }),
    }),
  },
}));

import { openGamesFilterSchema } from "./open-games";
import { discoverOpenGames } from "./open-games-queries";

beforeEach(() => {
  mocks.where.mockReset();
  mocks.where.mockReturnValue({
    orderBy: () => ({ limit: async () => [] }),
  });
});

describe("Open games date parameter encoding", () => {
  it.each([
    [{ time: "morning" }, ["05:00", "12:00"]],
    [{ time: "afternoon" }, ["12:00", "17:00"]],
    [{ time: "evening" }, ["17:00"]],
    [
      { time: "custom", timeFrom: "09:00", timeTo: "11:00" },
      ["09:00", "11:00"],
    ],
    [{ price: "free" }, [0]],
    [{ price: "paid", minPrice: "100", maxPrice: "500" }, [0, 10000, 50000]],
    [{ location: "100%_club" }, ["%100\\%\\_club%"]],
  ])("binds filter values safely: %j", async (input, expected) => {
    await discoverOpenGames(undefined, openGamesFilterSchema.parse(input));
    const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]);
    for (const parameter of expected) expect(query.params).toContain(parameter);
    expect(query.params).toContain("public");
    expect(query.params).toContain("published");
    expect(query.params).toContain("live");
  });

  it("applies available-spots filtering in SQL", async () => {
    await discoverOpenGames(
      undefined,
      openGamesFilterSchema.parse({ available: "1" })
    );
    const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]);
    expect(query.sql).toContain("count(*)::int");
    expect(query.sql).toContain('< "sessions"."capacity"');
  });
  it.each([
    { date: "today" },
    { date: "custom", dateFrom: "2026-09-07", dateTo: "2026-09-07" },
  ])(
    "encodes $date bounds as timestamps rather than raw Dates",
    async (input) => {
      await discoverOpenGames(
        undefined,
        openGamesFilterSchema.parse(input),
        null,
        new Date("2026-09-06T16:16:43.824Z")
      );
      const query = new PgDialect().sqlToQuery(mocks.where.mock.calls[0][0]);
      expect(query.params).toContain("2026-09-06T16:00:00.000Z");
      expect(query.params).toContain("2026-09-07T16:00:00.000Z");
      expect(query.params.some((value) => value instanceof Date)).toBe(false);
    }
  );
});
