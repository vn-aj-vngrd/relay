import "server-only";

import {
  type AnyColumn,
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNotNull,
  lt,
  ne,
  or,
  type SQL,
  sql,
} from "drizzle-orm";
import { connection } from "next/server";

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
  signupSettings,
  users,
  venueChangeRequests,
  venueOperatingPeriods,
  venues,
} from "@/db/schema";
import {
  ADMIN_PAGE_SIZE,
  type AdminCourtRequestRecord,
  type AdminPage,
  type AdminSessionRecord,
  type AdminUserRecord,
  type AdminVenueRecord,
} from "@/features/admin/records";
import {
  buildHostRetention,
  type SessionFunnel,
} from "@/features/analytics/insights";
import {
  openVenueChangeRequestStatuses,
  type VenueChangeRequestStatus,
  venueChangeRequestStatuses,
} from "@/features/venues/request-status";

import { type AdminCursor, encodeAdminCursor } from "./cursor";

export async function getAdminInsights() {
  await connection();
  const monthAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const fourPlayerGames = db
    .select({ sessionId: sessionPlayers.sessionId })
    .from(sessionPlayers)
    .where(eq(sessionPlayers.rsvp, "going"))
    .groupBy(sessionPlayers.sessionId)
    .having(sql`count(*) >= 4`)
    .as("four_player_games");
  const completedMatchGames = db
    .select({ sessionId: matches.sessionId })
    .from(matches)
    .where(eq(matches.status, "completed"))
    .groupBy(matches.sessionId)
    .as("completed_match_games");
  const [
    profileCount,
    onboardingCount,
    tourCount,
    discoveryRows,
    funnelRows,
    publicationRows,
    qualifyingRows,
    experienceRows,
    followUpRows,
  ] = await Promise.all([
    db.$count(profiles),
    db.$count(profiles, isNotNull(profiles.onboardingCompletedAt)),
    db.$count(profiles, isNotNull(profiles.productTourCompletedAt)),
    db
      .select({ source: profiles.discoverySource, total: count() })
      .from(profiles)
      .where(isNotNull(profiles.discoverySource))
      .groupBy(profiles.discoverySource),
    db
      .select({
        published: sql<number>`count(distinct ${sessions.id})::int`,
        inviteShared: sql<number>`count(distinct ${sessions.id}) filter (where ${productEvents.name} = 'invite_shared')::int`,
        rsvpSaved: sql<number>`count(distinct ${sessions.id}) filter (where ${productEvents.name} = 'rsvp_saved')::int`,
        fourPlayers: sql<number>`count(distinct ${sessions.id}) filter (
          where ${productEvents.name} = 'fourth_player_joined' or ${fourPlayerGames.sessionId} is not null
        )::int`,
        playStarted: sql<number>`count(distinct ${sessions.id}) filter (where ${productEvents.name} = 'play_started')::int`,
        firstMatchCompleted: sql<number>`count(distinct ${sessions.id}) filter (where ${productEvents.name} = 'first_match_completed')::int`,
        sessionCompleted: sql<number>`count(distinct ${sessions.id}) filter (where ${productEvents.name} = 'session_completed')::int`,
        recapShared: sql<number>`count(distinct ${sessions.id}) filter (where ${productEvents.name} = 'recap_shared')::int`,
      })
      .from(sessions)
      .leftJoin(productEvents, eq(productEvents.sessionId, sessions.id))
      .leftJoin(fourPlayerGames, eq(fourPlayerGames.sessionId, sessions.id))
      .where(gte(sessions.publishedAt, monthAgo)),
    db
      .select({ hostId: sessions.hostId, publishedAt: sessions.publishedAt })
      .from(sessions)
      .where(isNotNull(sessions.publishedAt))
      .orderBy(asc(sessions.publishedAt)),
    db
      .select({ total: sql<number>`count(distinct ${sessions.id})::int` })
      .from(sessions)
      .innerJoin(fourPlayerGames, eq(fourPlayerGames.sessionId, sessions.id))
      .innerJoin(
        completedMatchGames,
        eq(completedMatchGames.sessionId, sessions.id)
      )
      .where(eq(sessions.status, "completed")),
    db
      .select({
        experience: feedbackSubmissions.experience,
        responses: sql<number>`count(*)::int`,
        games: sql<number>`count(distinct ${feedbackSubmissions.sessionId})::int`,
      })
      .from(feedbackSubmissions)
      .where(isNotNull(feedbackSubmissions.experience))
      .groupBy(feedbackSubmissions.experience),
    db
      .select({
        playAgainGames: sql<number>`count(distinct ${productEvents.sessionId}) filter (where ${productEvents.name} = 'play_again_published')::int`,
        smoothResponses: sql<number>`count(*) filter (where ${productEvents.name} = 'post_game_feedback_smooth')::int`,
        dismissedPrompts: sql<number>`count(*) filter (where ${productEvents.name} = 'post_game_feedback_dismissed')::int`,
      })
      .from(productEvents),
  ]);
  const discovery = new Map(
    discoveryRows.map(({ source, total }) => [source, Number(total)])
  );
  const answeredDiscovery = [...discovery.values()].reduce(
    (sum, total) => sum + total,
    0
  );
  const emptyFunnel: SessionFunnel = {
    published: 0,
    inviteShared: 0,
    rsvpSaved: 0,
    fourPlayers: 0,
    playStarted: 0,
    firstMatchCompleted: 0,
    sessionCompleted: 0,
    recapShared: 0,
  };
  const funnel = funnelRows[0] ?? emptyFunnel;
  const experience = new Map(
    experienceRows.map((row) => [
      row.experience,
      { responses: Number(row.responses), games: Number(row.games) },
    ])
  );
  return {
    profileCount,
    onboardingCount,
    tourCount,
    unansweredDiscovery: Math.max(0, profileCount - answeredDiscovery),
    discovery,
    funnel: Object.fromEntries(
      Object.entries(funnel).map(([key, total]) => [key, Number(total)])
    ) as SessionFunnel,
    hostRetention: buildHostRetention(
      publicationRows.flatMap(({ hostId, publishedAt }) =>
        publishedAt ? [{ hostId, publishedAt }] : []
      )
    ),
    betaReadiness: {
      qualifyingGames: Number(qualifyingRows[0]?.total ?? 0),
      smoothResponses: Number(followUpRows[0]?.smoothResponses ?? 0),
      issueResponses: experience.get("issues")?.responses ?? 0,
      gamesWithIssues: experience.get("issues")?.games ?? 0,
      playAgainGames: Number(followUpRows[0]?.playAgainGames ?? 0),
      dismissedPrompts: Number(followUpRows[0]?.dismissedPrompts ?? 0),
    },
  };
}

export async function getAdminOverview() {
  await connection();
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  const [totalsRows, recentActions, lifecycleEvents, signupCapacity] =
    await Promise.all([
      db
        .select({
          userCount: sql<number>`count(*)::int`,
          newUsers: sql<number>`count(*) filter (where ${users.createdAt} >= ${weekAgo.toISOString()}::timestamptz)::int`,
          suspendedUsers: sql<number>`count(*) filter (where ${users.suspendedAt} is not null)::int`,
          sessionCount: sql<number>`(select count(*)::int from ${sessions})`,
          upcomingSessions: sql<number>`(
          select count(*)::int from ${sessions}
          where ${sessions.startsAt} >= ${now.toISOString()}::timestamptz
            and ${sessions.status} in ('published', 'live')
        )`,
          liveSessions: sql<number>`(
          select count(*)::int from ${sessions} where ${sessions.status} = 'live'
        )`,
          newFeedbackCount: sql<number>`(
          select count(*)::int from ${feedbackSubmissions} where ${feedbackSubmissions.status} = 'new'
        )`,
        })
        .from(users),
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
      db.query.signupSettings.findFirst({
        columns: { accountCap: true },
        where: eq(signupSettings.id, "global"),
      }),
    ]);
  const totals = totalsRows[0] ?? {
    userCount: 0,
    newUsers: 0,
    suspendedUsers: 0,
    sessionCount: 0,
    upcomingSessions: 0,
    liveSessions: 0,
    newFeedbackCount: 0,
  };
  return {
    ...totals,
    recentActions,
    accountCap: signupCapacity?.accountCap ?? 200,
    lifecycle: new Map(
      lifecycleEvents.map(({ name, total }) => [name, Number(total)])
    ),
  };
}

function afterCursor(
  column: AnyColumn,
  idColumn: AnyColumn,
  cursor: AdminCursor | null
) {
  return cursor
    ? or(
        lt(column, cursor.at),
        and(eq(column, cursor.at), lt(idColumn, cursor.id))
      )
    : undefined;
}

function paged<T extends { id: string }>(
  rows: T[],
  dateFor: (item: T) => Date
): AdminPage<T> {
  const items = rows.slice(0, ADMIN_PAGE_SIZE);
  const last = items.at(-1);
  return {
    items,
    nextCursor:
      rows.length > ADMIN_PAGE_SIZE && last
        ? encodeAdminCursor({ at: dateFor(last), id: last.id })
        : null,
  };
}

export async function getAdminUsers(
  input: { query?: string; cursor?: AdminCursor | null } = {}
) {
  await connection();
  const conditions: SQL[] = [];
  if (input.query?.trim()) {
    const pattern = `%${input.query.trim()}%`;
    const search = or(
      ilike(users.email, pattern),
      ilike(profiles.name, pattern),
      ilike(profiles.username, pattern)
    );
    if (search) conditions.push(search);
  }
  const cursorCondition = afterCursor(
    users.createdAt,
    users.id,
    input.cursor ?? null
  );
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
  await connection();
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

const validStatuses = new Set([
  "draft",
  "published",
  "live",
  "completed",
  "cancelled",
]);

export async function getAdminSessions(
  input: { query?: string; status?: string; cursor?: AdminCursor | null } = {}
) {
  await connection();
  const conditions: SQL[] = [];
  if (input.query?.trim()) {
    const pattern = `%${input.query.trim()}%`;
    const search = or(
      ilike(sessions.title, pattern),
      ilike(sessions.venueName, pattern),
      ilike(users.email, pattern)
    );
    if (search) conditions.push(search);
  }
  if (input.status && validStatuses.has(input.status))
    conditions.push(
      eq(
        sessions.status,
        input.status as (typeof sessions.status.enumValues)[number]
      )
    );
  const cursorCondition = afterCursor(
    sessions.startsAt,
    sessions.id,
    input.cursor ?? null
  );
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
  await connection();
  const [record, playerCount, matchCount, messageCount, expenseCount] =
    await Promise.all([
      db
        .select({
          session: sessions,
          hostEmail: users.email,
          hostName: profiles.name,
        })
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
  return record[0]
    ? { ...record[0], playerCount, matchCount, messageCount, expenseCount }
    : null;
}

const venueStatuses = new Set([
  "unverified",
  "pending",
  "verified",
  "rejected",
  "archived",
]);

export async function getAdminVenues(
  input: { query?: string; status?: string; cursor?: AdminCursor | null } = {}
) {
  await connection();
  const conditions: SQL[] = [];
  if (input.query?.trim()) {
    const pattern = `%${input.query.trim()}%`;
    const search = or(
      ilike(venues.name, pattern),
      ilike(venues.address, pattern)
    );
    if (search) conditions.push(search);
  }
  if (input.status && venueStatuses.has(input.status))
    conditions.push(
      eq(
        venues.listingStatus,
        input.status as (typeof venues.listingStatus.enumValues)[number]
      )
    );
  const priority = sql<number>`case when ${venues.listingStatus} = 'pending' then 1 else 0 end`;
  if (input.cursor) {
    const cursorCondition = or(
      lt(priority, input.cursor.priority ?? 0),
      and(
        eq(priority, input.cursor.priority ?? 0),
        lt(venues.id, input.cursor.id)
      )
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
        ? encodeAdminCursor({
            at: last.updatedAt,
            id: last.id,
            priority: last.priority,
          })
        : null,
  };
}

export async function getAdminVenueChangeRequests(
  input: {
    query?: string;
    status?: string;
    type?: string;
    cursor?: AdminCursor | null;
  } = {}
) {
  await connection();
  const conditions: SQL[] = [];
  const query = input.query?.trim();
  if (query) {
    const pattern = `%${query}%`;
    const search = or(
      ilike(venues.name, pattern),
      ilike(venues.address, pattern),
      ilike(profiles.name, pattern),
      sql<boolean>`coalesce(${venueChangeRequests.proposedChanges}->>'name', '') ilike ${pattern}`,
      sql<boolean>`coalesce(${venueChangeRequests.proposedChanges}->>'address', '') ilike ${pattern}`
    );
    if (search) conditions.push(search);
  }
  if (input.status === "open") {
    conditions.push(
      inArray(venueChangeRequests.status, openVenueChangeRequestStatuses)
    );
  } else if (
    venueChangeRequestStatuses.includes(
      input.status as VenueChangeRequestStatus
    )
  ) {
    conditions.push(
      eq(venueChangeRequests.status, input.status as VenueChangeRequestStatus)
    );
  }
  if (input.type === "create" || input.type === "update") {
    conditions.push(eq(venueChangeRequests.requestType, input.type));
  }

  const priority = sql<number>`case when ${venueChangeRequests.status} in ('submitted', 'needs_info', 'in_review') then 1 else 0 end`;
  if (input.cursor) {
    const cursorCondition = or(
      lt(priority, input.cursor.priority ?? 0),
      and(
        eq(priority, input.cursor.priority ?? 0),
        or(
          gt(venueChangeRequests.createdAt, input.cursor.at),
          and(
            eq(venueChangeRequests.createdAt, input.cursor.at),
            gt(venueChangeRequests.id, input.cursor.id)
          )
        )
      )
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const [rows, statusRows] = await Promise.all([
    db
      .select({
        priority,
        id: venueChangeRequests.id,
        requestType: venueChangeRequests.requestType,
        status: venueChangeRequests.status,
        proposedChanges: venueChangeRequests.proposedChanges,
        createdAt: venueChangeRequests.createdAt,
        venueName: venues.name,
        venueAddress: venues.address,
        submitterName: profiles.name,
        sameCourtOpenCount: sql<number>`case
          when ${venueChangeRequests.venueId} is null then 1
          else (select count(*)::int from venue_change_requests sibling
            where sibling.venue_id = ${venueChangeRequests.venueId}
              and sibling.status in ('submitted', 'needs_info', 'in_review'))
        end`,
      })
      .from(venueChangeRequests)
      .leftJoin(venues, eq(venues.id, venueChangeRequests.venueId))
      .leftJoin(
        profiles,
        eq(profiles.userId, venueChangeRequests.submittedById)
      )
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(
        desc(priority),
        asc(venueChangeRequests.createdAt),
        asc(venueChangeRequests.id)
      )
      .limit(ADMIN_PAGE_SIZE + 1),
    db
      .select({ status: venueChangeRequests.status, total: count() })
      .from(venueChangeRequests)
      .groupBy(venueChangeRequests.status),
  ]);

  const pageRows = rows.slice(0, ADMIN_PAGE_SIZE);
  const items: AdminCourtRequestRecord[] = pageRows.map((row) => {
    const proposal = row.proposedChanges as Record<string, unknown>;
    return {
      id: row.id,
      requestType: row.requestType,
      status: row.status,
      name:
        row.venueName ??
        (typeof proposal.name === "string"
          ? proposal.name
          : "New court request"),
      address:
        row.venueAddress ??
        (typeof proposal.address === "string" ? proposal.address : null),
      createdAt: row.createdAt,
      submitterName: row.submitterName,
      fieldCount: Object.keys(proposal).length,
      sameCourtOpenCount: Number(row.sameCourtOpenCount),
    };
  });
  const last = pageRows.at(-1);
  return {
    items,
    nextCursor:
      rows.length > ADMIN_PAGE_SIZE && last
        ? encodeAdminCursor({
            at: last.createdAt,
            id: last.id,
            priority: last.priority,
          })
        : null,
    statusCounts: Object.fromEntries(
      statusRows.map((row) => [row.status, Number(row.total)])
    ) as Partial<Record<VenueChangeRequestStatus, number>>,
  };
}

export async function getAdminVenueChangeRequest(requestId: string) {
  await connection();
  const request = await db.query.venueChangeRequests.findFirst({
    where: eq(venueChangeRequests.id, requestId),
  });
  if (!request) return null;
  const [venue, operatingHours, submitter, relatedRequests] = await Promise.all(
    [
      request.venueId
        ? db.query.venues.findFirst({ where: eq(venues.id, request.venueId) })
        : null,
      request.venueId
        ? db
            .select()
            .from(venueOperatingPeriods)
            .where(eq(venueOperatingPeriods.venueId, request.venueId))
            .orderBy(
              asc(venueOperatingPeriods.dayOfWeek),
              asc(venueOperatingPeriods.sequence)
            )
        : [],
      request.submittedById
        ? db.query.profiles.findFirst({
            where: eq(profiles.userId, request.submittedById),
          })
        : null,
      request.venueId
        ? db
            .select({
              id: venueChangeRequests.id,
              status: venueChangeRequests.status,
              createdAt: venueChangeRequests.createdAt,
              proposedChanges: venueChangeRequests.proposedChanges,
            })
            .from(venueChangeRequests)
            .where(
              and(
                eq(venueChangeRequests.venueId, request.venueId),
                ne(venueChangeRequests.id, request.id),
                inArray(
                  venueChangeRequests.status,
                  openVenueChangeRequestStatuses
                )
              )
            )
            .orderBy(asc(venueChangeRequests.createdAt))
            .limit(8)
        : [],
    ]
  );
  return {
    ...request,
    venue: venue ? { ...venue, operatingHours } : null,
    submitter: submitter ?? null,
    relatedRequests,
  };
}

export async function getAdminVenue(venueId: string) {
  await connection();
  const venue = await db.query.venues.findFirst({
    where: eq(venues.id, venueId),
  });
  if (!venue) return null;
  const operatingHours = await db
    .select()
    .from(venueOperatingPeriods)
    .where(eq(venueOperatingPeriods.venueId, venueId))
    .orderBy(
      asc(venueOperatingPeriods.dayOfWeek),
      asc(venueOperatingPeriods.sequence)
    );
  return { ...venue, operatingHours };
}

export async function getAdminAuditLog(cursor: AdminCursor | null = null) {
  await connection();
  const cursorCondition = afterCursor(
    adminAuditLogs.createdAt,
    adminAuditLogs.id,
    cursor
  );
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
