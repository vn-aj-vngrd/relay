import "server-only";

import {
  and,
  asc,
  count,
  desc,
  eq,
  gt,
  gte,
  inArray,
  lt,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { cache } from "react";

import { db } from "@/db/client";
import {
  expenses,
  matches,
  profiles,
  sessionPlayers,
  sessions,
} from "@/db/schema";

import { formatSessionDate, formatSessionTime, sessionDateKey } from "./format";
import type {
  GameCollectionItem,
  GameCollectionPage,
  GameCollectionPhase,
  GameCollectionScope,
  GameInvitationPage,
} from "./game-collection-types";
import { encodeGameCursor, type GameCursor } from "./game-pagination";
import { visibleHomePendingCount } from "./home-presentation";
import { sessionReadiness } from "./readiness";
import { eligiblePlayerCount } from "./readiness-query";
import { resolveSessionWorkspaceAccess } from "./session-access";

export async function getUserSessions(userId: string) {
  return db
    .select({ session: sessions, player: sessionPlayers })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(
      and(
        eq(sessionPlayers.userId, userId),
        or(
          and(
            eq(sessionPlayers.rsvp, "invited"),
            inArray(sessions.status, ["published", "live"])
          ),
          and(
            inArray(sessionPlayers.rsvp, [
              "pending",
              "going",
              "maybe",
              "waitlisted",
            ]),
            inArray(sessions.status, ["published", "live", "completed"])
          )
        )
      )
    )
    .orderBy(asc(sessions.startsAt));
}

const HOME_UPCOMING_LIMIT = 4;
const HOME_RECENT_LIMIT = 4;

export async function getHomeSessions(userId: string) {
  const now = new Date();
  const membershipCondition = userSessionCondition(userId);
  const [invitations, primaryRows, upcoming, recent] = await Promise.all([
    db
      .select({ session: sessions, player: sessionPlayers })
      .from(sessionPlayers)
      .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
      .where(
        and(
          eq(sessionPlayers.userId, userId),
          eq(sessionPlayers.rsvp, "invited"),
          gt(sessions.endsAt, now),
          inArray(sessions.status, ["published", "live"])
        )
      )
      .orderBy(asc(sessions.startsAt), asc(sessions.id))
      .limit(3),
    db
      .select({ session: sessions, player: sessionPlayers })
      .from(sessionPlayers)
      .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
      .where(
        and(
          membershipCondition,
          or(eq(sessions.hostId, userId), eq(sessionPlayers.rsvp, "going")),
          gt(sessions.endsAt, now),
          inArray(sessions.status, ["published", "live"])
        )
      )
      .orderBy(
        sql`case when ${sessions.status} = 'live' then 0 else 1 end`,
        asc(sessions.startsAt),
        asc(sessions.id)
      )
      .limit(1),
    db
      .select({ session: sessions, player: sessionPlayers })
      .from(sessionPlayers)
      .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
      .where(
        and(
          membershipCondition,
          inArray(sessionPlayers.rsvp, [
            "pending",
            "going",
            "maybe",
            "waitlisted",
          ]),
          gt(sessions.endsAt, now),
          inArray(sessions.status, ["published", "live"])
        )
      )
      .orderBy(asc(sessions.startsAt), asc(sessions.id))
      .limit(HOME_UPCOMING_LIMIT),
    db
      .select({ session: sessions, player: sessionPlayers })
      .from(sessionPlayers)
      .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
      .where(
        and(
          membershipCondition,
          or(
            eq(sessions.status, "completed"),
            and(
              lte(sessions.endsAt, now),
              inArray(sessions.status, ["published", "live"])
            )
          )
        )
      )
      .orderBy(desc(sessions.startsAt), desc(sessions.id))
      .limit(HOME_RECENT_LIMIT + 1),
  ]);
  const rows = [...invitations, ...primaryRows, ...upcoming, ...recent];
  const sessionIds = rows.map(({ session }) => session.id);
  const hostIds = [...new Set(rows.map(({ session }) => session.hostId))];
  const [counts, expenseRows, hostProfiles] = rows.length
    ? await Promise.all([
        db
          .select({
            sessionId: sessionPlayers.sessionId,
            goingTotal: sql<number>`count(*) filter (where ${sessionPlayers.rsvp} = 'going')`,
            eligibleTotal: eligiblePlayerCount,
            pendingTotal: sql<number>`count(*) filter (where ${sessionPlayers.rsvp} = 'pending')`,
          })
          .from(sessionPlayers)
          .where(inArray(sessionPlayers.sessionId, sessionIds))
          .groupBy(sessionPlayers.sessionId),
        db
          .select({ sessionId: expenses.sessionId })
          .from(expenses)
          .where(inArray(expenses.sessionId, sessionIds)),
        db
          .select({ userId: profiles.userId, name: profiles.name })
          .from(profiles)
          .where(inArray(profiles.userId, hostIds)),
      ])
    : [[], [], []];
  const playerCounts = new Map(
    counts.map(({ sessionId, goingTotal }) => [sessionId, Number(goingTotal)])
  );
  const pendingCounts = new Map(
    counts.map(({ sessionId, pendingTotal }) => [
      sessionId,
      Number(pendingTotal),
    ])
  );
  const sessionsWithExpense = new Set(
    expenseRows.map(({ sessionId }) => sessionId)
  );
  const hostNames = new Map(
    hostProfiles.map(({ userId, name }) => [userId, name])
  );
  const enrich = (row: (typeof rows)[number]) => {
    const pendingCount = pendingCounts.get(row.session.id) ?? 0;
    return {
      ...row,
      playerCount: playerCounts.get(row.session.id) ?? 0,
      pendingCount: visibleHomePendingCount(
        pendingCount,
        row.player.role,
        row.session.hostId === userId
      ),
      hasExpense: sessionsWithExpense.has(row.session.id),
      eligiblePlayerCount: Number(
        counts.find((count) => count.sessionId === row.session.id)
          ?.eligibleTotal ?? 0
      ),
      hostName: hostNames.get(row.session.hostId) ?? "Relay host",
    };
  };

  return {
    invitations: invitations.map(enrich),
    primary: primaryRows[0] ? enrich(primaryRows[0]) : null,
    upcoming: upcoming.map(enrich),
    recent: recent.map(enrich),
  };
}

const GAME_PAGE_SIZE = 24;

type UserSessionRow = Awaited<ReturnType<typeof getUserSessions>>[number];

async function toGameCollectionItems(
  userId: string,
  rows: UserSessionRow[]
): Promise<GameCollectionItem[]> {
  if (!rows.length) return [];
  const now = new Date();
  const sessionIds = rows.map(({ session }) => session.id);
  const hostIds = [...new Set(rows.map(({ session }) => session.hostId))];
  const [counts, hostProfiles] = await Promise.all([
    db
      .select({
        sessionId: sessionPlayers.sessionId,
        total: count(),
        eligibleTotal: eligiblePlayerCount,
      })
      .from(sessionPlayers)
      .where(
        and(
          inArray(sessionPlayers.sessionId, sessionIds),
          eq(sessionPlayers.rsvp, "going")
        )
      )
      .groupBy(sessionPlayers.sessionId),
    db
      .select({ userId: profiles.userId, name: profiles.name })
      .from(profiles)
      .where(inArray(profiles.userId, hostIds)),
  ]);
  const playerCounts = new Map(
    counts.map(({ sessionId, total }) => [sessionId, Number(total)])
  );
  const hostNames = new Map(
    hostProfiles.map(({ userId, name }) => [userId, name])
  );

  return rows.map(({ session, player }) => {
    const playerCount = playerCounts.get(session.id) ?? 0;
    return {
      id: session.id,
      href: `/games/${session.id}`,
      title: session.title,
      date: formatSessionDate(session.startsAt, session.timezone),
      dateKey: sessionDateKey(session.startsAt, session.timezone),
      endsAt: session.endsAt.toISOString(),
      time: formatSessionTime(
        session.startsAt,
        session.endsAt,
        session.timezone
      ),
      venue: session.venueName,
      playerCount,
      capacity: session.capacity,
      status: session.status,
      accentColor: session.accentColor,
      viewerRsvp: player.rsvp,
      invitedAt: player.invitedAt.toISOString(),
      hostName: hostNames.get(session.hostId) ?? "Relay host",
      playerPriceCents: session.playerPriceCents,
      requiresApproval: session.requiresApproval,
      spotsRemaining: Math.max(0, session.capacity - playerCount),
      canReplay: session.hostId === userId && session.status === "completed",
      ...(session.hostId === userId &&
      session.endsAt > now &&
      session.status === "published"
        ? {
            readiness: sessionReadiness({
              goingCount: Number(
                counts.find((count) => count.sessionId === session.id)
                  ?.eligibleTotal ?? 0
              ),
              booked: Boolean(session.bookedAt),
              bookingNotRequired: session.bookingNotRequired,
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
      and(
        eq(sessionPlayers.rsvp, "invited"),
        inArray(sessions.status, ["published", "live"])
      ),
      and(
        inArray(sessionPlayers.rsvp, [
          "pending",
          "going",
          "maybe",
          "waitlisted",
        ]),
        inArray(sessions.status, ["published", "live", "completed"])
      )
    )
  );
}

function invitationCondition(userId: string, now = new Date()) {
  return and(
    eq(sessionPlayers.userId, userId),
    eq(sessionPlayers.rsvp, "invited"),
    gt(sessions.endsAt, now),
    inArray(sessions.status, ["published", "live"])
  );
}

export async function getInvitationCount(userId: string) {
  const [result] = await db
    .select({ total: count() })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(invitationCondition(userId));
  return Number(result?.total ?? 0);
}

export async function getGameInvitations(
  userId: string
): Promise<GameInvitationPage> {
  const rows = await db
    .select({ session: sessions, player: sessionPlayers })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(invitationCondition(userId))
    .orderBy(asc(sessions.startsAt), asc(sessions.id));
  return {
    items: await toGameCollectionItems(userId, rows),
    total: rows.length,
  };
}

export async function getGameCollectionPage(
  userId: string,
  phase: GameCollectionPhase,
  cursor: GameCursor | null = null,
  scope: GameCollectionScope = "all"
): Promise<GameCollectionPage> {
  const now = new Date();
  const ascending = phase === "upcoming";
  const membershipCondition =
    scope === "organizing"
      ? and(
          eq(sessionPlayers.userId, userId),
          inArray(sessionPlayers.role, ["host", "cohost"])
        )
      : userSessionCondition(userId);
  const phaseCondition = ascending
    ? and(
        gt(sessions.endsAt, now),
        inArray(sessions.status, ["published", "live"])
      )
    : or(
        eq(sessions.status, "completed"),
        scope === "organizing" ? eq(sessions.status, "cancelled") : undefined,
        and(
          lte(sessions.endsAt, now),
          inArray(sessions.status, ["published", "live"])
        )
      );
  const cursorCondition = cursor
    ? ascending
      ? or(
          gt(sessions.startsAt, cursor.at),
          and(eq(sessions.startsAt, cursor.at), gt(sessions.id, cursor.id))
        )
      : or(
          lt(sessions.startsAt, cursor.at),
          and(eq(sessions.startsAt, cursor.at), lt(sessions.id, cursor.id))
        )
    : undefined;
  const rows = await db
    .select({ session: sessions, player: sessionPlayers })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(
      and(
        membershipCondition,
        phase === "upcoming" && scope === "all"
          ? ne(sessionPlayers.rsvp, "invited")
          : undefined,
        phaseCondition,
        cursorCondition
      )
    )
    .orderBy(
      ascending ? asc(sessions.startsAt) : desc(sessions.startsAt),
      ascending ? asc(sessions.id) : desc(sessions.id)
    )
    .limit(GAME_PAGE_SIZE + 1);
  const hasMore = rows.length > GAME_PAGE_SIZE;
  const pageRows = rows.slice(0, GAME_PAGE_SIZE);
  const last = pageRows.at(-1)?.session;

  return {
    items: await toGameCollectionItems(userId, pageRows),
    nextCursor:
      hasMore && last
        ? encodeGameCursor({ at: last.startsAt, id: last.id })
        : null,
  };
}

export async function getGameCollectionMonth(
  userId: string,
  monthKey: string,
  scope: GameCollectionScope = "all"
) {
  const monthStart = new Date(`${monthKey}-01T00:00:00.000Z`);
  const membershipCondition =
    scope === "organizing"
      ? and(
          eq(sessionPlayers.userId, userId),
          inArray(sessionPlayers.role, ["host", "cohost"])
        )
      : and(userSessionCondition(userId), ne(sessionPlayers.rsvp, "invited"));
  const rangeStart = new Date(monthStart);
  rangeStart.setUTCDate(rangeStart.getUTCDate() - 1);
  const rangeEnd = new Date(
    Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 2)
  );
  const rows = await db
    .select({ session: sessions, player: sessionPlayers })
    .from(sessionPlayers)
    .innerJoin(sessions, eq(sessionPlayers.sessionId, sessions.id))
    .where(
      and(
        membershipCondition,
        gte(sessions.startsAt, rangeStart),
        lt(sessions.startsAt, rangeEnd),
        inArray(
          sessions.status,
          scope === "organizing"
            ? ["published", "live", "completed", "cancelled"]
            : ["published", "live", "completed"]
        )
      )
    )
    .orderBy(asc(sessions.startsAt), asc(sessions.id));
  const items = (await toGameCollectionItems(userId, rows)).filter((item) =>
    item.dateKey.startsWith(monthKey)
  );
  const now = Date.now();
  return {
    upcoming: items.filter(
      (item) =>
        ["published", "live"].includes(item.status) &&
        new Date(item.endsAt).getTime() > now
    ),
    past: items.filter(
      (item) =>
        item.status === "completed" ||
        item.status === "cancelled" ||
        new Date(item.endsAt).getTime() <= now
    ),
  };
}

export const getPublicSession = cache(async function getPublicSession(
  slug: string
) {
  const session = await db.query.sessions.findFirst({
    where: and(
      eq(sessions.slug, slug),
      inArray(sessions.status, ["published", "live", "completed", "cancelled"]),
      inArray(sessions.visibility, ["public", "link"])
    ),
  });
  if (!session) return null;
  const roster = await db
    .select({ player: sessionPlayers, profile: profiles })
    .from(sessionPlayers)
    .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
    .where(
      and(
        eq(sessionPlayers.sessionId, session.id),
        or(
          inArray(sessionPlayers.rsvp, ["going", "waitlisted", "maybe"]),
          inArray(sessionPlayers.role, ["host", "cohost"])
        )
      )
    )
    .orderBy(
      asc(sessionPlayers.waitlistPosition),
      asc(sessionPlayers.createdAt)
    );
  const [hostProfile, matchCount] = await Promise.all([
    db.query.profiles.findFirst({ where: eq(profiles.userId, session.hostId) }),
    db.$count(
      matches,
      and(eq(matches.sessionId, session.id), eq(matches.status, "completed"))
    ),
  ]);
  return { session, roster, hostProfile, matchCount };
});

export async function getSessionMembership(sessionId: string, userId: string) {
  return db.query.sessionPlayers.findFirst({
    where: and(
      eq(sessionPlayers.sessionId, sessionId),
      eq(sessionPlayers.userId, userId)
    ),
  });
}

export const getSessionForWorkspace = cache(
  async function getSessionForWorkspace(sessionId: string, userId: string) {
    const [session, membership] = await Promise.all([
      db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) }),
      getSessionMembership(sessionId, userId),
    ]);
    if (!session) return null;
    const access = resolveSessionWorkspaceAccess({
      userId,
      hostId: session.hostId,
      visibility: session.visibility,
      status: session.status,
      endsAt: session.endsAt,
      playerPriceCents: session.playerPriceCents,
      membership,
    });
    if (!access) return null;
    const publicRosterOnly =
      access === "discoverer" || access === "invited" || access === "pending";
    const roster = await db
      .select({ player: sessionPlayers, profile: profiles })
      .from(sessionPlayers)
      .leftJoin(profiles, eq(sessionPlayers.userId, profiles.userId))
      .where(
        and(
          eq(sessionPlayers.sessionId, sessionId),
          publicRosterOnly
            ? inArray(sessionPlayers.rsvp, ["going", "waitlisted", "maybe"])
            : undefined
        )
      )
      .orderBy(
        asc(sessionPlayers.waitlistPosition),
        asc(sessionPlayers.createdAt)
      );
    return { session, membership, roster, access };
  }
);

export const getSessionForUser = cache(async function getSessionForUser(
  sessionId: string,
  userId: string
) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
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

export async function getSessionForParticipant(
  sessionId: string,
  userId: string
) {
  const data = await getSessionForUser(sessionId, userId);
  if (!data) return null;
  if (data.session.hostId === userId) return data;
  return data.membership &&
    ["going", "maybe", "waitlisted"].includes(data.membership.rsvp)
    ? data
    : null;
}
