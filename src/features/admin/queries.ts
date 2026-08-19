import "server-only";

import { and, count, desc, eq, gte, ilike, isNotNull, or, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import {
  adminAuditLogs,
  expenses,
  feedbackSubmissions,
  matches,
  messages,
  productEvents,
  profiles,
  sessionPlayers,
  sessions,
  users,
} from "@/db/schema";

export async function getAdminOverview() {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [
    userCount,
    newUsers,
    suspendedUsers,
    sessionCount,
    upcomingSessions,
    liveSessions,
    newFeedbackCount,
    recentActions,
    lifecycleEvents,
  ] = await Promise.all([
    db.$count(users),
    db.$count(users, gte(users.createdAt, weekAgo)),
    db.$count(users, isNotNull(users.suspendedAt)),
    db.$count(sessions),
    db.$count(
      sessions,
      and(gte(sessions.startsAt, now), or(eq(sessions.status, "published"), eq(sessions.status, "live"))),
    ),
    db.$count(sessions, eq(sessions.status, "live")),
    db.$count(feedbackSubmissions, eq(feedbackSubmissions.status, "new")),
    db
      .select({ log: adminAuditLogs, actorEmail: users.email })
      .from(adminAuditLogs)
      .innerJoin(users, eq(adminAuditLogs.actorUserId, users.id))
      .orderBy(desc(adminAuditLogs.createdAt))
      .limit(6),
    db
      .select({ name: productEvents.name, total: count() })
      .from(productEvents)
      .where(gte(productEvents.createdAt, monthAgo))
      .groupBy(productEvents.name),
  ]);
  return {
    userCount,
    newUsers,
    suspendedUsers,
    sessionCount,
    upcomingSessions,
    liveSessions,
    newFeedbackCount,
    recentActions,
    lifecycle: new Map(lifecycleEvents.map(({ name, total }) => [name, Number(total)])),
  };
}

export async function getAdminUsers(query = "") {
  const pattern = `%${query.trim()}%`;
  const where = query.trim()
    ? or(ilike(users.email, pattern), ilike(profiles.name, pattern), ilike(profiles.username, pattern))
    : undefined;
  return db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      suspendedAt: users.suspendedAt,
      name: profiles.name,
      username: profiles.username,
      sessionsHosted: count(sessions.id),
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(sessions, eq(sessions.hostId, users.id))
    .where(where)
    .groupBy(users.id, profiles.name, profiles.username)
    .orderBy(desc(users.createdAt))
    .limit(50);
}

export async function getAdminUser(userId: string) {
  const [account, hostedCount, joinedCount] = await Promise.all([
    db
      .select({ user: users, profile: profiles })
      .from(users)
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(users.id, userId))
      .limit(1),
    db.$count(sessions, eq(sessions.hostId, userId)),
    db.$count(sessionPlayers, eq(sessionPlayers.userId, userId)),
  ]);
  return account[0] ? { ...account[0], hostedCount, joinedCount } : null;
}

const validStatuses = new Set(["draft", "published", "live", "completed", "cancelled"]);

export async function getAdminSessions(query = "", status = "") {
  const conditions: SQL[] = [];
  if (query.trim()) {
    const pattern = `%${query.trim()}%`;
    const search = or(ilike(sessions.title, pattern), ilike(sessions.venueName, pattern), ilike(users.email, pattern));
    if (search) conditions.push(search);
  }
  if (validStatuses.has(status))
    conditions.push(eq(sessions.status, status as (typeof sessions.status.enumValues)[number]));
  const where = conditions.length ? and(...conditions) : undefined;

  return db
    .select({
      id: sessions.id,
      slug: sessions.slug,
      title: sessions.title,
      venueName: sessions.venueName,
      startsAt: sessions.startsAt,
      status: sessions.status,
      capacity: sessions.capacity,
      hostEmail: users.email,
      hostName: profiles.name,
      playerCount: count(sessionPlayers.id),
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.hostId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .leftJoin(sessionPlayers, eq(sessionPlayers.sessionId, sessions.id))
    .where(where)
    .groupBy(sessions.id, users.email, profiles.name)
    .orderBy(desc(sessions.startsAt))
    .limit(75);
}

export async function getAdminSession(sessionId: string) {
  const [record, playerCount, matchCount, messageCount, expenseCount] = await Promise.all([
    db
      .select({ session: sessions, hostEmail: users.email, hostName: profiles.name })
      .from(sessions)
      .innerJoin(users, eq(users.id, sessions.hostId))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(eq(sessions.id, sessionId))
      .limit(1),
    db.$count(sessionPlayers, eq(sessionPlayers.sessionId, sessionId)),
    db.$count(matches, eq(matches.sessionId, sessionId)),
    db.$count(messages, eq(messages.sessionId, sessionId)),
    db.$count(expenses, eq(expenses.sessionId, sessionId)),
  ]);
  return record[0] ? { ...record[0], playerCount, matchCount, messageCount, expenseCount } : null;
}

export async function getAdminAuditLog() {
  return db
    .select({ log: adminAuditLogs, actorEmail: users.email, actorName: profiles.name })
    .from(adminAuditLogs)
    .innerJoin(users, eq(users.id, adminAuditLogs.actorUserId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .orderBy(desc(adminAuditLogs.createdAt))
    .limit(100);
}
