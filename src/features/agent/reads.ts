import "server-only";
import {
  and,
  asc,
  desc,
  eq,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { db } from "@/db/client";
import {
  groupMembers,
  groups,
  profiles,
  sessionPlayers,
  sessions,
} from "@/db/schema";
import { groupCollectionCondition } from "@/features/groups/collection-query";
import {
  defaultGroupFilters,
  type GroupFilters,
} from "@/features/groups/filters";
import { gameLibraryFilterSchema } from "@/features/sessions/game-library-filters";
import {
  gameLibraryConditions,
  gameLibraryMembership,
  gameLibraryPhase,
} from "@/features/sessions/game-library-query";
import { postGameContinuation } from "@/features/sessions/post-game";
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
  const libraryMembership = db
    .select({ id: sessionPlayers.id })
    .from(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, sessions.id),
        gameLibraryConditions(
          userId,
          gameLibraryFilterSchema.parse({
            collection: input.scope === "invitations" ? "invitations" : "games",
            when: "all",
            role: input.scope === "hosting" ? "host" : input.role,
            response: input.scope === "joining" ? "going" : input.response,
            cancelled:
              input.includeCancelled || input.status === "cancelled"
                ? "true"
                : "false",
            venue: input.venue,
            q: "",
          }),
          now
        )
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
    gameLibraryPhase("upcoming", now),
    or(
      and(isNull(sessions.bookedAt), eq(sessions.bookingNotRequired, false)),
      sql`${goingCount} < 4`,
      sql`${pendingCount} > 0`
    )
  );
  const groupOwner = db
    .select({ id: groups.id })
    .from(groups)
    .where(and(eq(groups.id, sessions.groupId), eq(groups.ownerId, userId)));
  const scope =
    input.scope === "open"
      ? publicDiscoveryCondition(now)
      : input.scope === "groups"
        ? and(
            sql`exists (${groupAccess})`,
            or(ne(sessions.status, "draft"), sql`exists (${groupOwner})`)
          )
        : input.scope === "hosting"
          ? input.when === "drafts"
            ? isHost
            : sql`exists (${libraryMembership})`
          : input.scope === "joining"
            ? sql`exists (${libraryMembership})`
            : input.scope === "attention"
              ? or(
                  needsHostAttention,
                  and(activeMember, sql`${myRsvp} in ('invited', 'pending')`)
                )
              : input.when === "drafts" && input.scope === "mine"
                ? isHost
                : sql`exists (${libraryMembership})`;
  const viewerRole = db
    .select({ id: sessionPlayers.id })
    .from(sessionPlayers)
    .where(
      and(
        eq(sessionPlayers.sessionId, sessions.id),
        eq(sessionPlayers.userId, userId),
        isNull(sessionPlayers.leftAt),
        input.role === "cohost" || input.role === "player"
          ? eq(sessionPlayers.role, input.role)
          : undefined
      )
    );
  const phase =
    input.when === "drafts"
      ? eq(sessions.status, "draft")
      : and(
          inArray(sessions.status, [
            "published",
            "live",
            "completed",
            "cancelled",
          ]),
          input.when === "past" || input.when === "upcoming"
            ? gameLibraryPhase(input.when, now)
            : input.when === "current"
              ? and(
                  gameLibraryPhase("upcoming", now),
                  or(eq(sessions.status, "live"), lte(sessions.startsAt, now))
                )
              : undefined
        );
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
      bookingNeeded: sql<boolean>`case when ${and(isHost, gameLibraryPhase("upcoming", now))} then (${sessions.bookedAt} is null and not ${sessions.bookingNotRequired}) else false end`,
    })
    .from(sessions)
    .where(
      and(
        scope,
        phase,
        input.role === "host"
          ? isHost
          : input.role !== "any"
            ? and(ne(sessions.hostId, userId), sql`exists (${viewerRole})`)
            : undefined,
        input.response !== "any"
          ? sql`${myRsvp} = ${input.response}`
          : undefined,
        input.response === "invited"
          ? gameLibraryPhase("upcoming", now)
          : undefined,
        input.status ? eq(sessions.status, input.status) : undefined,
        !input.includeCancelled && input.status !== "cancelled"
          ? ne(sessions.status, "cancelled")
          : undefined,
        input.venue ? eq(sessions.venueName, input.venue) : undefined,
        input.groupId ? eq(sessions.groupId, input.groupId) : undefined,
        input.from ? sql`${localDay} >= ${input.from}::date` : undefined,
        input.until ? sql`${localDay} <= ${input.until}::date` : undefined,
        input.query
          ? or(
              ilike(sessions.title, pattern),
              ilike(sessions.venueName, pattern),
              sql`exists (select 1 from ${profiles} where ${profiles.userId} = ${sessions.hostId} and ${ilike(profiles.name, pattern)})`
            )
          : undefined
      )
    )
    .orderBy(
      input.when === "past" || input.when === "all"
        ? desc(sessions.startsAt)
        : asc(sessions.startsAt),
      asc(sessions.id)
    )
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
    when: input.when,
    status: input.status,
    timezone: "Asia/Manila",
    asOf: now.toISOString(),
  };
}

export async function getAgentGameWorkspace(userId: string, id: string) {
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
  if (!session) return null;
  if (member?.leftAt && session.hostId !== userId) return null;
  if (
    !member &&
    session.hostId !== userId &&
    !isPubliclyDiscoverable(session, new Date())
  )
    return null;
  const data = await getSessionForWorkspace(id, userId);
  if (!data || (data.membership?.leftAt && data.session.hostId !== userId))
    return null;
  return data;
}

export async function readAgentGame(userId: string, id: string) {
  const data = await getAgentGameWorkspace(userId, id);
  return data
    ? {
        ...projectAgentGame(data),
        continuation: postGameContinuation(data.session, userId),
      }
    : { unavailable: true };
}

// Explicit projection is the data boundary: no tokens, emails, payment handles,
// raw profiles, configuration or other arbitrary database fields.
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
    venueAddress: session.venueAddress,
    notes: session.notes?.slice(0, 4000),
    groupId: session.groupId,
    visibility: session.visibility,
    courtCount: session.courtCount,
    rotationMode: session.rotationMode,
    roundDurationMinutes: session.roundDurationMinutes,
    rosterLocked: session.rosterLocked,
    requiresApproval: session.requiresApproval,
    booking: {
      bookedAt: session.bookedAt,
      notRequired: session.bookingNotRequired,
      ...(organizer
        ? {
            reference: session.bookingReference,
            totalCents: session.bookingTotalCents,
            notes: session.bookingNotes?.slice(0, 4000),
          }
        : {}),
    },
    completedAt: session.completedAt,
    cancelledAt: session.cancelledAt,
    cancellationReason: session.cancellationReason,
    myRsvp: data.membership?.rsvp ?? null,
    sections: ["players", "play", "payments", "chat", "story"].map(
      (section) => ({ section, href: `/games/${session.id}/${section}` })
    ),
    access,
    players: players.slice(0, 100).map(({ player, profile }) => ({
      name: (profile?.name ?? player.guestName ?? "Player").slice(0, 100),
      rsvp: player.rsvp,
      role: player.role,
      checkedInAt: player.checkedInAt,
      playState: player.playState,
    })),
    rosterTruncated: players.length > 100,
  };
}

export async function readAgentGroups(
  userId: string,
  offset: number,
  filters: GroupFilters = defaultGroupFilters
) {
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      slug: groups.slug,
      role: groupMembers.role,
      description: groups.description,
      memberCount: sql<number>`(select count(*)::int from ${groupMembers} as members where members.group_id = ${groups.id})`,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(groupCollectionCondition(userId, filters))
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

export async function readAgentGroup(
  userId: string,
  reference: string,
  offset: number
) {
  const group = await db.query.groups.findFirst({
    where: or(
      eq(groups.slug, reference),
      sql`${groups.id}::text = ${reference}`
    ),
  });
  if (!group) return { unavailable: true };
  const membership = await db.query.groupMembers.findFirst({
    where: and(
      eq(groupMembers.groupId, group.id),
      eq(groupMembers.userId, userId)
    ),
  });
  if (!membership) return { unavailable: true };
  const members = await db
    .select({ name: profiles.name, role: groupMembers.role })
    .from(groupMembers)
    .innerJoin(profiles, eq(groupMembers.userId, profiles.userId))
    .where(eq(groupMembers.groupId, group.id))
    .orderBy(asc(groupMembers.joinedAt), asc(groupMembers.userId))
    .limit(21)
    .offset(offset);
  return {
    id: group.id,
    name: group.name,
    description: group.description,
    role: membership.role,
    href: `/groups/${group.slug}`,
    members: members.slice(0, 20),
    truncated: members.length > 20,
    nextOffset: members.length > 20 && offset < 200 ? offset + 20 : null,
    games: { scope: "groups", groupId: group.id, when: "all" },
  };
}
