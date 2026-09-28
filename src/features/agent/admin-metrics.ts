import "server-only";

import { eq, gte, sql } from "drizzle-orm";
import { db } from "@/db/client";
import {
  agentMessageUsage,
  agentRequestMetrics,
  feedbackSubmissions,
} from "@/db/schema";

export async function getAgentAdminMetrics(now = new Date()) {
  const sevenDaysAgo = new Date(now.getTime() - 7 * 86_400_000);
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86_400_000);
  const [row] = await db
    .select({
      charged7Days: sql<number>`count(*) filter (where ${agentMessageUsage.status} = 'charged' and ${agentMessageUsage.createdAt} >= ${sevenDaysAgo.toISOString()})::int`,
      released7Days: sql<number>`count(*) filter (where ${agentMessageUsage.status} = 'released' and ${agentMessageUsage.createdAt} >= ${sevenDaysAgo.toISOString()})::int`,
      charged30Days: sql<number>`count(*) filter (where ${agentMessageUsage.status} = 'charged')::int`,
      released30Days: sql<number>`count(*) filter (where ${agentMessageUsage.status} = 'released')::int`,
      activeUsers30Days: sql<number>`count(distinct ${agentMessageUsage.userId}) filter (where ${agentMessageUsage.status} = 'charged')::int`,
      reserved30Days: sql<number>`count(*) filter (where ${agentMessageUsage.status} = 'reserved' and ${agentMessageUsage.expiresAt} > ${now.toISOString()})::int`,
    })
    .from(agentMessageUsage)
    .where(gte(agentMessageUsage.createdAt, thirtyDaysAgo));
  let feedback: {
    reports30Days: number;
    openReports: number;
    goodRatings30Days: number;
    badRatings30Days: number;
  } | null = null;
  try {
    const [row] = await db
      .select({
        reports30Days: sql<number>`count(*) filter (where ${feedbackSubmissions.agentRating} is null and ${feedbackSubmissions.createdAt} >= ${thirtyDaysAgo.toISOString()})::int`,
        openReports: sql<number>`count(*) filter (where ${feedbackSubmissions.agentRating} is null and ${feedbackSubmissions.status} in ('new', 'reviewing', 'planned'))::int`,
        goodRatings30Days: sql<number>`count(*) filter (where ${feedbackSubmissions.agentRating} = 'good' and ${feedbackSubmissions.agentRatedAt} >= ${thirtyDaysAgo.toISOString()})::int`,
        badRatings30Days: sql<number>`count(*) filter (where ${feedbackSubmissions.agentRating} = 'bad' and ${feedbackSubmissions.agentRatedAt} >= ${thirtyDaysAgo.toISOString()})::int`,
      })
      .from(feedbackSubmissions)
      .where(eq(feedbackSubmissions.area, "agent"));
    feedback = row
      ? {
          reports30Days: Number(row.reports30Days ?? 0),
          openReports: Number(row.openReports ?? 0),
          goodRatings30Days: Number(row.goodRatings30Days ?? 0),
          badRatings30Days: Number(row.badRatings30Days ?? 0),
        }
      : null;
  } catch {
    // Feedback availability must not hide the usage ledger.
  }
  let requests: {
    attempts7Days: number;
    failed7Days: number;
    attempts30Days: number;
    failed30Days: number;
    stopped30Days: number;
    toolFailures30Days: number;
    averageDurationMs: number;
    p95DurationMs: number;
    averageFirstTextMs: number;
    firstTextCount30Days: number;
    costUsdMicros: number;
    costReported30Days: number;
  } | null = null;
  try {
    const [row] = await db
      .select({
        attempts7Days: sql<number>`count(*) filter (where ${agentRequestMetrics.createdAt} >= ${sevenDaysAgo.toISOString()})::int`,
        failed7Days: sql<number>`count(*) filter (where ${agentRequestMetrics.status} = 'failed' and ${agentRequestMetrics.createdAt} >= ${sevenDaysAgo.toISOString()})::int`,
        attempts30Days: sql<number>`count(*)::int`,
        failed30Days: sql<number>`count(*) filter (where ${agentRequestMetrics.status} = 'failed')::int`,
        stopped30Days: sql<number>`count(*) filter (where ${agentRequestMetrics.status} = 'stopped')::int`,
        toolFailures30Days: sql<number>`coalesce(sum(${agentRequestMetrics.toolFailures}), 0)::int`,
        averageDurationMs: sql<number>`coalesce(round(avg(${agentRequestMetrics.durationMs})), 0)::int`,
        p95DurationMs: sql<number>`coalesce(round((percentile_cont(0.95) within group (order by ${agentRequestMetrics.durationMs}))::numeric), 0)::int`,
        averageFirstTextMs: sql<number>`coalesce(round(avg(${agentRequestMetrics.firstTextMs})), 0)::int`,
        firstTextCount30Days: sql<number>`count(${agentRequestMetrics.firstTextMs})::int`,
        costUsdMicros: sql<number>`coalesce(sum(${agentRequestMetrics.costUsdMicros}), 0)::bigint`,
        costReported30Days: sql<number>`count(${agentRequestMetrics.costUsdMicros})::int`,
      })
      .from(agentRequestMetrics)
      .where(gte(agentRequestMetrics.createdAt, thirtyDaysAgo));
    requests = row
      ? {
          attempts7Days: Number(row.attempts7Days ?? 0),
          failed7Days: Number(row.failed7Days ?? 0),
          attempts30Days: Number(row.attempts30Days ?? 0),
          failed30Days: Number(row.failed30Days ?? 0),
          stopped30Days: Number(row.stopped30Days ?? 0),
          toolFailures30Days: Number(row.toolFailures30Days ?? 0),
          averageDurationMs: Number(row.averageDurationMs ?? 0),
          p95DurationMs: Number(row.p95DurationMs ?? 0),
          averageFirstTextMs: Number(row.averageFirstTextMs ?? 0),
          firstTextCount30Days: Number(row.firstTextCount30Days ?? 0),
          costUsdMicros: Number(row.costUsdMicros ?? 0),
          costReported30Days: Number(row.costReported30Days ?? 0),
        }
      : null;
  } catch {
    // A missing metrics migration must not hide the existing usage ledger.
  }
  return {
    charged7Days: Number(row?.charged7Days ?? 0),
    released7Days: Number(row?.released7Days ?? 0),
    charged30Days: Number(row?.charged30Days ?? 0),
    released30Days: Number(row?.released30Days ?? 0),
    activeUsers30Days: Number(row?.activeUsers30Days ?? 0),
    reserved30Days: Number(row?.reserved30Days ?? 0),
    reports30Days: feedback?.reports30Days ?? null,
    openReports: feedback?.openReports ?? null,
    goodRatings30Days: feedback?.goodRatings30Days ?? null,
    badRatings30Days: feedback?.badRatings30Days ?? null,
    requests,
  };
}

export async function getAgentRequestTrend(now = new Date()) {
  const start = new Date(now);
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - 13);
  const day = sql<string>`to_char(${agentRequestMetrics.createdAt} at time zone 'UTC', 'YYYY-MM-DD')`;
  const rows = await db
    .select({
      day,
      attempts: sql<number>`count(*)::int`,
      failed: sql<number>`count(*) filter (where ${agentRequestMetrics.status} = 'failed')::int`,
      stopped: sql<number>`count(*) filter (where ${agentRequestMetrics.status} = 'stopped')::int`,
    })
    .from(agentRequestMetrics)
    .where(gte(agentRequestMetrics.createdAt, start))
    .groupBy(day);
  const byDay = new Map(rows.map((row) => [row.day, row]));
  return Array.from({ length: 14 }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    const key = date.toISOString().slice(0, 10);
    const row = byDay.get(key);
    return {
      day: key,
      attempts: Number(row?.attempts ?? 0),
      failed: Number(row?.failed ?? 0),
      stopped: Number(row?.stopped ?? 0),
    };
  });
}
