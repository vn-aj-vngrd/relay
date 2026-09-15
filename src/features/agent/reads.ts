import "server-only";
import { and, asc, eq, gt, ilike, inArray, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { groupMembers, groups, sessionPlayers, sessions } from "@/db/schema";
import { gameLibraryMembership } from "@/features/sessions/game-library-query";
import { isPubliclyDiscoverable } from "@/features/sessions/public-discovery";
import { publicDiscoveryCondition } from "@/features/sessions/public-discovery-query";
import { getSessionForWorkspace } from "@/features/sessions/queries";
import type { GameSearch } from "./validation";

const summaryColumns = {
  id: sessions.id,
  title: sessions.title,
  startsAt: sessions.startsAt,
  endsAt: sessions.endsAt,
  timezone: sessions.timezone,
  venue: sessions.venueName,
  status: sessions.status,
  capacity: sessions.capacity,
};

export async function searchAgentGames(userId: string, input: GameSearch) {
  const now = new Date();
  const membership = db
    .select({ id: sessionPlayers.id })
    .from(sessionPlayers)
    .where(
      and(
        gameLibraryMembership(userId),
        eq(sessionPlayers.sessionId, sessions.id)
      )
    );
  const groupAccess = db
    .select({ id: groupMembers.groupId })
    .from(groupMembers)
    .where(
      and(
        eq(groupMembers.userId, userId),
        eq(groupMembers.groupId, sessions.groupId)
      )
    );
  const ownMembership = db
    .select({ rsvp: sessionPlayers.rsvp })
    .from(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, sessions.id),
        eq(sessionPlayers.userId, userId),
        isNull(sessionPlayers.leftAt)
      )
    );
  const activeMember = sql`exists (${membership})`;
  const goingCount = sql<number>`(select count(*)::int from ${sessionPlayers} where ${sessionPlayers.sessionId} = ${sessions.id} and ${sessionPlayers.leftAt} is null and ${sessionPlayers.rsvp} = 'going')`;
  const pendingCount = sql<number>`(select count(*)::int from ${sessionPlayers} where ${sessionPlayers.sessionId} = ${sessions.id} and ${sessionPlayers.leftAt} is null and ${sessionPlayers.rsvp} = 'pending')`;
  const isHost = eq(sessions.hostId, userId);
  const myRsvp = sql<string | null>`(${ownMembership})`;
  const needsHostAttention = and(
    isHost,
    or(
      and(isNull(sessions.bookedAt), eq(sessions.bookingNotRequired, false)),
      sql`${goingCount} < 4`,
      sql`${pendingCount} > 0`
    )
  );
  const scope =
    input.scope === "open"
      ? publicDiscoveryCondition(now)
      : input.scope === "groups"
        ? sql`exists (${groupAccess})`
        : input.scope === "hosting"
          ? isHost
          : input.scope === "joining"
            ? and(activeMember, sql`${myRsvp} = 'going'`)
            : input.scope === "attention"
              ? or(
                  needsHostAttention,
                  and(activeMember, sql`${myRsvp} in ('invited', 'pending')`)
                )
              : or(isHost, activeMember);
  const localDay = sql`(${sessions.startsAt} at time zone 'Asia/Manila')::date`;
  const pattern = `%${input.query.replace(/[\\%_]/g, "\\$&")}%`;
  const rows = await db
    .select({
      ...summaryColumns,
      isHost: sql<boolean>`${isHost}`,
      myRsvp,
      goingCount,
      pendingCount: sql<
        number | null
      >`case when ${isHost} then ${pendingCount} else null end`,
      bookingNeeded: sql<boolean>`case when ${isHost} then (${sessions.bookedAt} is null and not ${sessions.bookingNotRequired}) else false end`,
    })
    .from(sessions)
    .where(
      and(
        scope,
        inArray(sessions.status, ["published", "live"]),
        gt(sessions.endsAt, now),
        input.groupId ? eq(sessions.groupId, input.groupId) : undefined,
        input.from ? sql`${localDay} >= ${input.from}::date` : undefined,
        input.until ? sql`${localDay} <= ${input.until}::date` : undefined,
        input.query
          ? or(
              ilike(sessions.title, pattern),
              ilike(sessions.venueName, pattern)
            )
          : undefined
      )
    )
    .orderBy(asc(sessions.startsAt), asc(sessions.id))
    .limit(21)
    .offset(input.offset);
  return {
    games: rows
      .slice(0, 20)
      .map((row) => ({ ...row, href: `/games/${row.id}` })),
    nextOffset:
      rows.length > 20 && input.offset < 200 ? input.offset + 20 : null,
    truncated: rows.length > 20,
    scope: input.scope,
    timezone: "Asia/Manila",
    asOf: now.toISOString(),
  };
}

export async function readAgentGame(userId: string, id: string) {
  // Reject stale/removed memberships before invoking the shared workspace reader.
  const [session, member] = await Promise.all([
    db.query.sessions.findFirst({ where: eq(sessions.id, id) }),
    db.query.sessionPlayers.findFirst({
      where: and(
        eq(sessionPlayers.sessionId, id),
        eq(sessionPlayers.userId, userId)
      ),
    }),
  ]);
  if (!session) return { unavailable: true };
  if (member?.leftAt && session.hostId !== userId) return { unavailable: true };
  if (
    !member &&
    session.hostId !== userId &&
    !isPubliclyDiscoverable(session, new Date())
  )
    return { unavailable: true };
  const data = await getSessionForWorkspace(id, userId);
  if (!data || (data.membership?.leftAt && data.session.hostId !== userId))
    return { unavailable: true };
  return projectAgentGame(data);
}

// Explicit projection is the data boundary: no tokens, emails, payment handles,
// notes, raw profiles, configuration or other arbitrary database fields.
export function projectAgentGame(
  data: NonNullable<Awaited<ReturnType<typeof getSessionForWorkspace>>>
) {
  const { session, roster, access } = data;
  const organizer = access === "host" || access === "cohost";
  const players = roster.filter(
    ({ player }) =>
      !player.leftAt &&
      (organizer || ["going", "maybe", "waitlisted"].includes(player.rsvp))
  );
  return {
    id: session.id,
    href: `/games/${session.id}`,
    title: session.title,
    startsAt: session.startsAt,
    endsAt: session.endsAt,
    timezone: session.timezone,
    venue: session.venueName,
    status: session.status,
    capacity: session.capacity,
    priceCents: session.playerPriceCents,
    access,
    players: players.slice(0, 100).map(({ player, profile }) => ({
      name: (profile?.name ?? player.guestName ?? "Player").slice(0, 100),
      rsvp: player.rsvp,
      role: player.role,
    })),
    rosterTruncated: players.length > 100,
  };
}

export async function readAgentGroups(userId: string, offset: number) {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      role: groupMembers.role,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, userId))
    .orderBy(asc(groups.name), asc(groups.id))
    .limit(21)
    .offset(offset);
  return {
    groups: rows
      .slice(0, 20)
      .map(({ slug, ...row }) => ({ ...row, href: `/groups/${slug}` })),
    truncated: rows.length > 20,
    nextOffset: rows.length > 20 && offset < 200 ? offset + 20 : null,
  };
}
