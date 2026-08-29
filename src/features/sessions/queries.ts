import "server-only";

import { and, asc, count, desc, eq, gt, gte, inArray, lt, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/client";
import { expenses, matches, profiles, sessionPlayers, sessions } from "@/db/schema";

import { formatSessionDate, formatSessionTime, sessionDateKey } from "./format";
import type { GameCollectionItem, GameCollectionPage, GameCollectionPhase } from "./game-collection-types";
import { encodeGameCursor, type GameCursor } from "./game-pagination";
import { sessionReadiness } from "./readiness";

export async function getUserSessions(userId: string) {
  return db
    .select({ session: sessions, player: sessionPlayers })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(
      and(
        eq(sessionPlayers.userId, userId),
        or(
          and(eq(sessionPlayers.rsvp, "invited"), inArray(sessions.status, ["published", "live"])),
          and(
            inArray(sessionPlayers.rsvp, ["pending", "going", "maybe", "waitlisted"]),
            inArray(sessions.status, ["published", "live", "completed"]),
          ),
        ),
      ),
    )
    .orderBy(asc(sessions.startsAt));
}

export async function getHomeSessions(userId: string) {
  const now = new Date();
  const rows = await getUserSessions(userId);
  const sessionIds = rows.map(({ session }) => session.id);
  const [counts, expenseRows] = rows.length
    ? await Promise.all([
        db
          .select({ sessionId: sessionPlayers.sessionId, total: count() })
          .from(sessionPlayers)
          .where(and(inArray(sessionPlayers.sessionId, sessionIds), eq(sessionPlayers.rsvp, "going")))
          .groupBy(sessionPlayers.sessionId),
        db.select({ sessionId: expenses.sessionId }).from(expenses).where(inArray(expenses.sessionId, sessionIds)),
      ])
    : [[], []];
  const playerCounts = new Map(counts.map(({ sessionId, total }) => [sessionId, Number(total)]));
  const sessionsWithExpense = new Set(expenseRows.map(({ sessionId }) => sessionId));
  const enriched = rows.map((row) => ({
    ...row,
    playerCount: playerCounts.get(row.session.id) ?? 0,
    hasExpense: sessionsWithExpense.has(row.session.id),
  }));
  return {
    upcoming: enriched.filter(({ session }) => session.startsAt >= now && session.status !== "cancelled"),
    recent: enriched
      .filter(({ session }) => session.startsAt < now || session.status === "completed")
      .sort((a, b) => b.session.startsAt.getTime() - a.session.startsAt.getTime()),
  };
}

const GAME_PAGE_SIZE = 24;

type UserSessionRow = Awaited<ReturnType<typeof getUserSessions>>[number];

async function toGameCollectionItems(userId: string, rows: UserSessionRow[]): Promise<GameCollectionItem[]> {
  if (!rows.length) return [];
  const sessionIds = rows.map(({ session }) => session.id);
  const [counts, expenseRows] = await Promise.all([
    db
      .select({ sessionId: sessionPlayers.sessionId, total: count() })
      .from(sessionPlayers)
      .where(and(inArray(sessionPlayers.sessionId, sessionIds), eq(sessionPlayers.rsvp, "going")))
      .groupBy(sessionPlayers.sessionId),
    db.select({ sessionId: expenses.sessionId }).from(expenses).where(inArray(expenses.sessionId, sessionIds)),
  ]);
  const playerCounts = new Map(counts.map(({ sessionId, total }) => [sessionId, Number(total)]));
  const sessionsWithExpense = new Set(expenseRows.map(({ sessionId }) => sessionId));

  return rows.map(({ session }) => {
    const playerCount = playerCounts.get(session.id) ?? 0;
    return {
      id: session.id,
      href: `/games/${session.id}`,
      title: session.title,
      date: formatSessionDate(session.startsAt, session.timezone),
      dateKey: sessionDateKey(session.startsAt, session.timezone),
      time: formatSessionTime(session.startsAt, session.endsAt, session.timezone),
      venue: session.venueName,
      playerCount,
      capacity: session.capacity,
      status: session.status,
      accentColor: session.accentColor,
      ...(session.hostId === userId
        ? {
            readiness: sessionReadiness({
              goingCount: playerCount,
              booked: Boolean(session.bookedAt),
              expectsCollection: Boolean(session.estimatedCostCents || session.bookingTotalCents),
              collectionCreated: sessionsWithExpense.has(session.id),
            }),
          }
        : {}),
    };
  });
}

function userSessionCondition(userId: string) {
  return and(
    eq(sessionPlayers.userId, userId),
    or(
      and(eq(sessionPlayers.rsvp, "invited"), inArray(sessions.status, ["published", "live"])),
      and(
        inArray(sessionPlayers.rsvp, ["pending", "going", "maybe", "waitlisted"]),
        inArray(sessions.status, ["published", "live", "completed"]),
      ),
    ),
  );
}

export async function getGameCollectionPage(
  userId: string,
  phase: GameCollectionPhase,
  cursor: GameCursor | null = null,
): Promise<GameCollectionPage> {
  const now = new Date();
  const ascending = phase === "upcoming";
  const phaseCondition = ascending
    ? and(gte(sessions.startsAt, now), inArray(sessions.status, ["published", "live"]))
    : or(lt(sessions.startsAt, now), eq(sessions.status, "completed"));
  const cursorCondition = cursor
    ? ascending
      ? or(gt(sessions.startsAt, cursor.at), and(eq(sessions.startsAt, cursor.at), gt(sessions.id, cursor.id)))
      : or(lt(sessions.startsAt, cursor.at), and(eq(sessions.startsAt, cursor.at), lt(sessions.id, cursor.id)))
    : undefined;
  const rows = await db
    .select({ session: sessions, player: sessionPlayers })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(and(userSessionCondition(userId), phaseCondition, cursorCondition))
    .orderBy(
      ascending ? asc(sessions.startsAt) : desc(sessions.startsAt),
      ascending ? asc(sessions.id) : desc(sessions.id),
    )
    .limit(GAME_PAGE_SIZE + 1);
  const hasMore = rows.length > GAME_PAGE_SIZE;
  const pageRows = rows.slice(0, GAME_PAGE_SIZE);
  const last = pageRows.at(-1)?.session;

  return {
    items: await toGameCollectionItems(userId, pageRows),
    nextCursor: hasMore && last ? encodeGameCursor({ at: last.startsAt, id: last.id }) : null,
  };
}

export async function getGameCollectionMonth(userId: string, monthKey: string) {
  const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
  const rangeStart = new Date(monthStart);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);
  const rangeEnd = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 2));
  const rows = await db
    .select({ session: sessions, player: sessionPlayers })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(
      and(
        userSessionCondition(userId),
        gte(sessions.startsAt, rangeStart),
        lt(sessions.startsAt, rangeEnd),
        inArray(sessions.status, ["published", "live", "completed"]),
      ),
    )
    .orderBy(asc(sessions.startsAt), asc(sessions.id));
  const items = (await toGameCollectionItems(userId, rows)).filter((item) => item.dateKey.startsWith(monthKey));
  const nowKey = sessionDateKey(new Date());
  return {
    upcoming: items.filter((item) => item.dateKey >= nowKey && item.status !== "completed"),
    past: items.filter((item) => item.dateKey < nowKey || item.status === "completed"),
  };
}

export const getPublicSession = cache(async function getPublicSession(slug: string) {
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.slug, slug),
      inArray(sessions.status, ["published", "live", "completed"]),
      inArray(sessions.visibility, ["public", "link"]),
    ),
  });
  if (!session) return null;
  const roster = await db
    .select({ player: sessionPlayers, profile: profiles })
    .from(sessionPlayers)
    .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
    .where(
      and(eq(sessionPlayers.sessionId, session.id), inArray(sessionPlayers.rsvp, ["going", "waitlisted", "maybe"])),
    )
    .orderBy(asc(sessionPlayers.waitlistPosition), asc(sessionPlayers.createdAt));
  const [hostProfile, matchCount] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.hostId) }),
    db.$count(matches, and(eq(matches.sessionId, session.id), eq(matches.status, "completed"))),
  ]);
  return { session, roster, hostProfile, matchCount };
});

export async function getSessionMembership(sessionId: string, userId: string) {
  return db.query.sessionPlayers.findFirst({
    where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, userId)),
  });
}

export const getSessionForUser = cache(async function getSessionForUser(sessionId: string, userId: string) {
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!session) return null;
  const membership = await getSessionMembership(sessionId, userId);
  if (!membership && session.hostId !== userId) return null;
  const roster = await db
    .select({ player: sessionPlayers, profile: profiles })
    .from(sessionPlayers)
    .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
    .where(eq(sessionPlayers.sessionId, sessionId))
    .orderBy(asc(sessionPlayers.createdAt));
  return { session, membership, roster };
});

export async function getSessionForParticipant(sessionId: string, userId: string) {
  const data = await getSessionForUser(sessionId, userId);
  if (!data) return null;
  if (data.session.hostId === userId) return data;
  return data.membership && ["going", "maybe", "waitlisted"].includes(data.membership.rsvp) ? data : null;
}
