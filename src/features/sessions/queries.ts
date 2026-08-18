import "server-only";

import { and, asc, count, eq, inArray, or } from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/client";
import { expenses, matches, profiles, sessionPlayers, sessions } from "@/db/schema";

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
