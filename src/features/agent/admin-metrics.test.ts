import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({ select: vi.fn(), where: vi.fn() }));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db: { select: mocks.select } }));

import { getAgentAdminMetrics, getAgentRequestTrend } from "./admin-metrics";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.select.mockReturnValue({ from: () => ({ where: mocks.where }) });
});

describe("Agent admin usage metrics", () => {
  it("fills empty UTC dates in the request trend without inventing attempts", async () => {
    const groupBy = vi
      .fn()
      .mockResolvedValue([
        { day: "2026-09-27", attempts: 3, failed: 1, stopped: 1 },
      ]);
    mocks.select.mockReturnValueOnce({
      from: () => ({ where: () => ({ groupBy }) }),
    });
    const trend = await getAgentRequestTrend(new Date("2026-09-28T15:00:00Z"));
    expect(trend).toHaveLength(14);
    expect(trend[0]).toEqual({
      day: "2026-09-15",
      attempts: 0,
      failed: 0,
      stopped: 0,
    });
    expect(trend[12]).toEqual({
      day: "2026-09-27",
      attempts: 3,
      failed: 1,
      stopped: 1,
    });
    expect(trend[13]?.day).toBe("2026-09-28");
    const filter = new PgDialect().sqlToQuery(
      mocks.select.mock.calls[0][0].day
    );
    expect(filter.sql).toContain("time zone 'UTC'");
  });

  it("reads only aggregate usage for the last 30 days", async () => {
    mocks.where.mockResolvedValueOnce([
      {
        charged7Days: 3,
        released7Days: 1,
        charged30Days: 8,
        released30Days: 2,
        activeUsers30Days: 4,
        reserved30Days: 1,
      },
    ]);
    mocks.where.mockResolvedValueOnce([
      {
        reports30Days: 2,
        openReports: 1,
        goodRatings30Days: 4,
        badRatings30Days: 2,
      },
    ]);
    mocks.where.mockResolvedValueOnce([
      {
        attempts7Days: 3,
        failed7Days: 1,
        attempts30Days: 7,
        failed30Days: 1,
        stopped30Days: 1,
        toolFailures30Days: 2,
        averageDurationMs: 2100,
        p95DurationMs: 6200,
        averageFirstTextMs: 900,
        firstTextCount30Days: 6,
        costUsdMicros: 12_500,
        costReported30Days: 5,
      },
    ]);
    const now = new Date("2026-09-27T00:00:00Z");
    expect(await getAgentAdminMetrics(now)).toEqual({
      charged7Days: 3,
      released7Days: 1,
      charged30Days: 8,
      released30Days: 2,
      activeUsers30Days: 4,
      reserved30Days: 1,
      reports30Days: 2,
      openReports: 1,
      goodRatings30Days: 4,
      badRatings30Days: 2,
      requests: {
        attempts7Days: 3,
        failed7Days: 1,
        attempts30Days: 7,
        failed30Days: 1,
        stopped30Days: 1,
        toolFailures30Days: 2,
        averageDurationMs: 2100,
        p95DurationMs: 6200,
        averageFirstTextMs: 900,
        firstTextCount30Days: 6,
        costUsdMicros: 12_500,
        costReported30Days: 5,
      },
    });
    const projection = mocks.select.mock.calls[0][0];
    const dialect = new PgDialect();
    expect(Object.keys(projection)).toEqual([
      "charged7Days",
      "released7Days",
      "charged30Days",
      "released30Days",
      "activeUsers30Days",
      "reserved30Days",
    ]);
    expect(dialect.sqlToQuery(projection.charged7Days).params).toEqual([
      "2026-09-20T00:00:00.000Z",
    ]);
    expect(dialect.sqlToQuery(projection.reserved30Days).params).toEqual([
      "2026-09-27T00:00:00.000Z",
    ]);
    const filter = dialect.sqlToQuery(mocks.where.mock.calls[0][0]);
    expect(filter.params).toEqual(["2026-08-28T00:00:00.000Z"]);
    const feedbackFilter = new PgDialect().sqlToQuery(
      mocks.where.mock.calls[1][0]
    );
    expect(feedbackFilter.params).toEqual(["agent"]);
    const feedbackProjection = mocks.select.mock.calls[1][0];
    expect(dialect.sqlToQuery(feedbackProjection.reports30Days).params).toEqual(
      ["2026-08-28T00:00:00.000Z"]
    );
    expect(dialect.sqlToQuery(feedbackProjection.reports30Days).sql).toContain(
      '"agent_rating" is null'
    );
    expect(
      dialect.sqlToQuery(feedbackProjection.goodRatings30Days).params
    ).toEqual(["2026-08-28T00:00:00.000Z"]);
    expect(
      dialect.sqlToQuery(feedbackProjection.goodRatings30Days).sql
    ).toContain('"agent_rated_at"');
    expect(
      dialect.sqlToQuery(feedbackProjection.badRatings30Days).sql
    ).not.toContain('"updated_at"');
    const requestProjection = mocks.select.mock.calls[2][0];
    expect(dialect.sqlToQuery(requestProjection.attempts7Days).params).toEqual([
      "2026-09-20T00:00:00.000Z",
    ]);
    const p95 = new PgDialect().sqlToQuery(requestProjection.p95DurationMs);
    expect(p95.sql).toContain("percentile_cont(0.95)");
  });

  it("returns zeroes when no usage is recorded", async () => {
    mocks.where.mockResolvedValueOnce([{}]);
    mocks.where.mockResolvedValueOnce([{}]);
    mocks.where.mockResolvedValueOnce([{}]);
    expect(await getAgentAdminMetrics()).toMatchObject({
      charged7Days: 0,
      charged30Days: 0,
      activeUsers30Days: 0,
      released30Days: 0,
      reports30Days: 0,
      goodRatings30Days: 0,
      badRatings30Days: 0,
      requests: { attempts30Days: 0 },
    });
  });

  it("keeps usage visible when request metrics are unavailable", async () => {
    mocks.where.mockResolvedValueOnce([{ charged30Days: 4 }]);
    mocks.where.mockResolvedValueOnce([{ reports30Days: 1 }]);
    mocks.where.mockRejectedValueOnce(new Error("missing metrics table"));
    expect(await getAgentAdminMetrics()).toMatchObject({
      charged30Days: 4,
      reports30Days: 1,
      requests: null,
    });
  });

  it("keeps usage visible when feedback reporting is unavailable", async () => {
    mocks.where.mockResolvedValueOnce([{ charged30Days: 4 }]);
    mocks.where.mockRejectedValueOnce(new Error("feedback unavailable"));
    mocks.where.mockResolvedValueOnce([{ attempts30Days: 2 }]);
    expect(await getAgentAdminMetrics()).toMatchObject({
      charged30Days: 4,
      reports30Days: null,
      openReports: null,
      goodRatings30Days: null,
      badRatings30Days: null,
      requests: { attempts30Days: 2 },
    });
  });
});
