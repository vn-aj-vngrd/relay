import "server-only";

import { and, type AnyColumn, count, desc, eq, gte, ilike, isNotNull, lt, or, type SQL, sql } from "drizzle-orm";

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
  venues,
} from "@/db/schema";
import {
  ADMIN_PAGE_SIZE,
  type AdminPage,
  type AdminSessionRecord,
  type AdminUserRecord,
  type AdminVenueRecord,
} from "@/features/admin/records";

import { type AdminCursor, encodeAdminCursor } from "./cursor";

export async function getAdminInsights() {
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const [profileCount, onboardingCount, tourCount, discoveryRows, lifecycleRows] = await Promise.all([
    db.$count(profiles),
    db.$count(profiles, isNotNull(profiles.onboardingCompletedAt)),
    db.$count(profiles, isNotNull(profiles.productTourCompletedAt)),
    db
      .select({ source: profiles.discoverySource, total: count() })
      .from(profiles)
      .where(isNotNull(profiles.discoverySource))
      .groupBy(profiles.discoverySource),
    db
      .select({ name: productEvents.name, total: count() })
      .from(productEvents)
      .where(gte(productEvents.createdAt, monthAgo))
      .groupBy(productEvents.name),
  ]);
  const discovery = new Map(discoveryRows.map(({ source, total }) => [source, Number(total)]));
  const answeredDiscovery = [...discovery.values()].reduce((sum, total) => sum + total, 0);
  return {
    profileCount,
    onboardingCount,
    tourCount,
    unansweredDiscovery: Math.max(0, profileCount - answeredDiscovery),
    discovery,
    lifecycle: new Map(lifecycleRows.map(({ name, total }) => [name, Number(total)])),
  };
}

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

function afterCursor(column: AnyColumn, idColumn: AnyColumn, cursor: AdminCursor | null) {
  return cursor ? or(lt(column, cursor.at), and(eq(column, cursor.at), lt(idColumn, cursor.id))) : undefined;
}

function paged<T extends { id: string }>(rows: T[], dateFor: (item: T) => Date): AdminPage<T> {
  const items = rows.slice(0, ADMIN_PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor: rows.length > ADMIN_PAGE_SIZE && last ? encodeAdminCursor({ at: dateFor(last), id: last.id }) : null,
  };
}

export async function getAdminUsers(input: { query?: string; cursor?: AdminCursor | null } = {}) {
  const conditions: SQL[] = [];
  if (input.query?.trim()) {
    const pattern = `%${input.query.trim()}%`;
    const search = or(ilike(users.email, pattern), ilike(profiles.name, pattern), ilike(profiles.username, pattern));
    if (search) conditions.push(search);
  }
  const cursorCondition = afterCursor(users.createdAt, users.id, input.cursor ?? null);
  if (cursorCondition) conditions.push(cursorCondition);

  const rows: AdminUserRecord[] = await db
    .select({
      id: users.id,
      email: users.email,
      createdAt: users.createdAt,
      suspendedAt: users.suspendedAt,
      name: profiles.name,
      username: profiles.username,
      sessionsHosted: sql<number>`(select count(*)::int from ${sessions} hosted where hosted.host_id = ${users.id})`,
    })
    .from(users)
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(users.createdAt), desc(users.id))
    .limit(ADMIN_PAGE_SIZE + 1);

  return paged(rows, (item) => new Date(item.createdAt));
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

export async function getAdminSessions(
  input: {
    query?: string;
    status?: string;
    cursor?: AdminCursor | null;
  } = {},
) {
  const conditions: SQL[] = [];
  if (input.query?.trim()) {
    const pattern = `%${input.query.trim()}%`;
    const search = or(ilike(sessions.title, pattern), ilike(sessions.venueName, pattern), ilike(users.email, pattern));
    if (search) conditions.push(search);
  }
  if (input.status && validStatuses.has(input.status))
    conditions.push(eq(sessions.status, input.status as (typeof sessions.status.enumValues)[number]));
  const cursorCondition = afterCursor(sessions.startsAt, sessions.id, input.cursor ?? null);
  if (cursorCondition) conditions.push(cursorCondition);

  const rows: AdminSessionRecord[] = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      venueName: sessions.venueName,
      startsAt: sessions.startsAt,
      status: sessions.status,
      capacity: sessions.capacity,
      hostEmail: users.email,
      hostName: profiles.name,
      playerCount: sql<number>`(select count(*)::int from ${sessionPlayers} roster where roster.session_id = ${sessions.id})`,
    })
    .from(sessions)
    .innerJoin(users, eq(users.id, sessions.hostId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(sessions.startsAt), desc(sessions.id))
    .limit(ADMIN_PAGE_SIZE + 1);

  return paged(rows, (item) => new Date(item.startsAt));
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

const venueStatuses = new Set(["unverified", "pending", "verified", "rejected", "archived"]);

export async function getAdminVenues(
  input: {
    query?: string;
    status?: string;
    cursor?: AdminCursor | null;
  } = {},
) {
  const conditions: SQL[] = [];
  if (input.query?.trim()) {
    const pattern = `%${input.query.trim()}%`;
    const search = or(ilike(venues.name, pattern), ilike(venues.address, pattern));
    if (search) conditions.push(search);
  }
  if (input.status && venueStatuses.has(input.status))
    conditions.push(eq(venues.listingStatus, input.status as (typeof venues.listingStatus.enumValues)[number]));
  const priority = sql<number>`case when ${venues.listingStatus} = 'pending' then 1 else 0 end`;
  if (input.cursor) {
    const cursorCondition = or(
      lt(priority, input.cursor.priority ?? 0),
      and(eq(priority, input.cursor.priority ?? 0), lt(venues.id, input.cursor.id)),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const rows = await db
    .select({
      priority,
      id: venues.id,
      name: venues.name,
      address: venues.address,
      source: venues.source,
      listingStatus: venues.listingStatus,
      courtCount: venues.courtCount,
      updatedAt: venues.updatedAt,
    })
    .from(venues)
    .where(conditions.length ? and(...conditions) : undefined)
    .orderBy(desc(priority), desc(venues.id))
    .limit(ADMIN_PAGE_SIZE + 1);

  const pageRows = rows.slice(0, ADMIN_PAGE_SIZE);
  const last = pageRows.at(-1);
  const items: AdminVenueRecord[] = pageRows.map((item) => ({
    id: item.id,
    name: item.name,
    address: item.address,
    source: item.source,
    listingStatus: item.listingStatus,
    courtCount: item.courtCount,
    updatedAt: item.updatedAt,
  }));
  return {
    items,
    nextCursor:
      rows.length > ADMIN_PAGE_SIZE && last
        ? encodeAdminCursor({ at: last.updatedAt, id: last.id, priority: last.priority })
        : null,
  };
}

export async function getAdminVenue(venueId: string) {
  return db.query.venues.findFirst({ where: eq(venues.id, venueId) });
}

export async function getAdminAuditLog(cursor: AdminCursor | null = null) {
  const cursorCondition = afterCursor(adminAuditLogs.createdAt, adminAuditLogs.id, cursor);
  const rows = await db
    .select({
      id: adminAuditLogs.id,
      action: adminAuditLogs.action,
      targetType: adminAuditLogs.targetType,
      targetId: adminAuditLogs.targetId,
      reason: adminAuditLogs.reason,
      createdAt: adminAuditLogs.createdAt,
      actorEmail: users.email,
      actorName: profiles.name,
    })
    .from(adminAuditLogs)
    .innerJoin(users, eq(users.id, adminAuditLogs.actorUserId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(cursorCondition)
    .orderBy(desc(adminAuditLogs.createdAt), desc(adminAuditLogs.id))
    .limit(ADMIN_PAGE_SIZE + 1);

  return paged(rows, (item) => item.createdAt);
}
