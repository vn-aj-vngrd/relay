import "server-only";
import { cache } from "react";
import { and, asc, count, eq, inArray } from "drizzle-orm";
import { db } from "@/db/client";
import { matches, profiles, sessionPlayers, sessions } from "@/db/schema";

export async function getUserSessions(userId: string) {
  return db.select({ session: sessions, player: sessionPlayers }).from(sessionPlayers).innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id)).where(and(eq(sessionPlayers.userId, userId), inArray(sessionPlayers.rsvp, ["going", "maybe", "waitlisted"]))).orderBy(asc(sessions.startsAt));
}

export async function getHomeSessions(userId: string) {
  const now = new Date();
  const rows = await getUserSessions(userId);
  const counts = rows.length ? await db.select({ sessionId: sessionPlayers.sessionId, total: count() }).from(sessionPlayers).where(and(inArray(sessionPlayers.sessionId, rows.map(({ session }) => session.id)), eq(sessionPlayers.rsvp, "going"))).groupBy(sessionPlayers.sessionId) : [];
  const playerCounts = new Map(counts.map(({ sessionId, total }) => [sessionId, Number(total)]));
  const enriched = rows.map((row) => ({ ...row, playerCount: playerCounts.get(row.session.id) ?? 0 }));
  return {
    upcoming: enriched.filter(({ session }) => session.startsAt >= now && session.status !== "cancelled"),
    recent: enriched.filter(({ session }) => session.startsAt < now || session.status === "completed").sort((a, b) => b.session.startsAt.getTime() - a.session.startsAt.getTime()).slice(0, 4),
  };
}

export const getPublicSession = cache(async function getPublicSession(slug: string) {
  const session = await db.query.sessions.findFirst({ where: and(eq(sessions.slug, slug), inArray(sessions.status, ["published", "live", "completed"])) });
  if (!session) return null;
  const roster = await db.select({ player: sessionPlayers, profile: profiles }).from(sessionPlayers).leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId)).where(and(eq(sessionPlayers.sessionId, session.id), inArray(sessionPlayers.rsvp, ["going", "waitlisted", "maybe"]))).orderBy(asc(sessionPlayers.waitlistPosition), asc(sessionPlayers.createdAt));
  const [hostProfile, matchCount] = await Promise.all([db.query.profiles.findFirst({ where: eq(profiles.userId, session.hostId) }), db.$count(matches, and(eq(matches.sessionId, session.id), eq(matches.status, "completed")))]);
  return { session, roster, hostProfile, matchCount };
});

export async function getSessionForUser(sessionId: string, userId: string) {
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!session) return null;
  const membership = await db.query.sessionPlayers.findFirst({ where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, userId)) });
  if (!membership && session.hostId !== userId) return null;
  const roster = await db.select({ player: sessionPlayers, profile: profiles }).from(sessionPlayers).leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId)).where(eq(sessionPlayers.sessionId, sessionId)).orderBy(asc(sessionPlayers.createdAt));
  return { session, membership, roster };
}
