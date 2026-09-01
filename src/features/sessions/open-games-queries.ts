import "server-only";

import { and, asc, eq, gt, ilike, inArray, isNotNull, lt, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { profiles, sessionPlayers, sessions } from "@/db/schema";

import { formatSessionDate, formatSessionTime } from "./format";
import {
  encodeOpenGameCursor,
  type OpenGameCursor,
  type OpenGameItem,
  type OpenGamesFilters,
  type OpenGamesPage,
} from "./open-games";

const OPEN_GAME_PAGE_SIZE = 20;
const manilaDay = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Asia/Manila",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

function dateCondition(filter: OpenGamesFilters["date"], now: Date) {
  if (filter === "any") return undefined;
  if (filter === "today") {
    const start = new Date(`${manilaDay.format(now)}T00:00:00+08:00`);
    const end = new Date(start.getTime() + 24 * 60 * 60 * 1000);
    return and(sql`${sessions.startsAt} >= ${start}`, lt(sessions.startsAt, end));
  }
  const days = filter === "7d" ? 7 : 30;
  return lt(sessions.startsAt, new Date(now.getTime() + days * 24 * 60 * 60 * 1000));
}

export async function discoverOpenGames(
  userId: string,
  filters: OpenGamesFilters,
  cursor: OpenGameCursor | null = null,
  now = new Date(),
): Promise<OpenGamesPage> {
  const goingCount = sql<number>`(
    select count(*)::int
    from ${sessionPlayers}
    where ${sessionPlayers.sessionId} = ${sessions.id}
      and ${sessionPlayers.rsvp} = 'going'
  )`;
  const locationPattern = `%${filters.location.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_")}%`;
  const rows = await db
    .select({
      id: sessions.id,
      slug: sessions.slug,
      title: sessions.title,
      startsAt: sessions.startsAt,
      endsAt: sessions.endsAt,
      timezone: sessions.timezone,
      venueName: sessions.venueName,
      venueAddress: sessions.venueAddress,
      hostName: profiles.name,
      capacity: sessions.capacity,
      estimatedCostCents: sessions.estimatedCostCents,
      requiresApproval: sessions.requiresApproval,
      status: sessions.status,
      accentColor: sessions.accentColor,
      playerCount: goingCount,
    })
    .from(sessions)
    .leftJoin(profiles, eq(profiles.userId, sessions.hostId))
    .where(
      and(
        eq(sessions.visibility, "public"),
        inArray(sessions.status, ["published", "live"]),
        gt(sessions.endsAt, now),
        isNotNull(sessions.estimatedCostCents),
        dateCondition(filters.date, now),
        filters.location
          ? or(ilike(sessions.venueName, locationPattern), ilike(sessions.venueAddress, locationPattern))
          : undefined,
        filters.available ? sql`${goingCount} < ${sessions.capacity}` : undefined,
        cursor
          ? or(gt(sessions.startsAt, cursor.at), and(eq(sessions.startsAt, cursor.at), gt(sessions.id, cursor.id)))
          : undefined,
      ),
    )
    .orderBy(asc(sessions.startsAt), asc(sessions.id))
    .limit(OPEN_GAME_PAGE_SIZE + 1);

  const hasMore = rows.length > OPEN_GAME_PAGE_SIZE;
  const pageRows = rows.slice(0, OPEN_GAME_PAGE_SIZE);
  const sessionIds = pageRows.map((row) => row.id);
  const memberships = sessionIds.length
    ? await db
        .select({ sessionId: sessionPlayers.sessionId, rsvp: sessionPlayers.rsvp })
        .from(sessionPlayers)
        .where(and(eq(sessionPlayers.userId, userId), inArray(sessionPlayers.sessionId, sessionIds)))
    : [];
  const rsvpBySession = new Map(memberships.map((membership) => [membership.sessionId, membership.rsvp]));
  const last = pageRows.at(-1);

  return {
    items: pageRows.map((row): OpenGameItem => ({
      id: row.id,
      slug: row.slug,
      title: row.title,
      startsAt: row.startsAt.toISOString(),
      endsAt: row.endsAt.toISOString(),
      date: formatSessionDate(row.startsAt, row.timezone),
      time: formatSessionTime(row.startsAt, row.endsAt, row.timezone),
      venue: row.venueName,
      venueAddress: row.venueAddress,
      hostName: row.hostName || "Relay host",
      playerCount: Number(row.playerCount),
      capacity: row.capacity,
      estimatedCostCents: row.estimatedCostCents ?? 0,
      requiresApproval: row.requiresApproval,
      status: row.status as "published" | "live",
      accentColor: row.accentColor,
      viewerRsvp: rsvpBySession.get(row.id) ?? null,
    })),
    nextCursor: hasMore && last ? encodeOpenGameCursor({ at: last.startsAt, id: last.id }) : null,
  };
}
