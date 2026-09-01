import "server-only";

import { and, asc, desc, eq, gt, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";

import { db } from "@/db/client";
import { groupMembers, groups, profiles, sessionPlayers, sessions, users, venues } from "@/db/schema";
import { groupImageUrl } from "@/features/groups/image";
import { profileAvatarUrl } from "@/features/players/avatar";
import { formatSessionDate } from "@/features/sessions/format";

import type { SearchFilter, SearchResponse, SearchResult } from "./domain";

function likeValue(value: string) {
  return value.replaceAll("\\", "\\\\").replaceAll("%", "\\%").replaceAll("_", "\\_");
}

function page<T>(rows: T[], limit: number) {
  return { rows: rows.slice(0, limit), more: rows.length > limit };
}

async function findGames(userId: string, query: string, offset: number, limit: number) {
  const pattern = `%${likeValue(query)}%`;
  const prefix = `${likeValue(query)}%`;
  const now = new Date();
  const goingCount = sql<number>`(
    select count(*)::int from ${sessionPlayers} roster
    where roster.session_id = ${sessions.id} and roster.rsvp = 'going'
  )`;
  const rows = await db
    .select({
      id: sessions.id,
      title: sessions.title,
      startsAt: sessions.startsAt,
      venueName: sessions.venueName,
      visibility: sessions.visibility,
      slug: sessions.slug,
      accentColor: sessions.accentColor,
      membershipId: sessionPlayers.id,
      membershipRsvp: sessionPlayers.rsvp,
      capacity: sessions.capacity,
      estimatedCostCents: sessions.estimatedCostCents,
      requiresApproval: sessions.requiresApproval,
      playerCount: goingCount,
    })
    .from(sessions)
    .leftJoin(
      sessionPlayers,
      and(
        eq(sessionPlayers.sessionId, sessions.id),
        eq(sessionPlayers.userId, userId),
        inArray(sessionPlayers.rsvp, ["invited", "pending", "going", "maybe", "waitlisted"]),
      ),
    )
    .where(
      and(
        inArray(sessions.status, ["published", "live", "completed"]),
        or(
          and(
            eq(sessions.visibility, "public"),
            inArray(sessions.status, ["published", "live"]),
            gt(sessions.endsAt, now),
            isNotNull(sessions.estimatedCostCents),
          ),
          eq(sessions.hostId, userId),
          isNotNull(sessionPlayers.id),
        ),
        or(ilike(sessions.title, pattern), ilike(sessions.venueName, pattern), ilike(sessions.venueAddress, pattern)),
      ),
    )
    .orderBy(
      sql`case
        when lower(${sessions.title}) = lower(${query}) then 0
        when lower(${sessions.title}) like lower(${prefix}) then 1
        when lower(${sessions.venueName}) like lower(${prefix}) then 2
        else 3
      end`,
      desc(sql`greatest(
        extensions.similarity(${sessions.title}, ${query}),
        extensions.similarity(${sessions.venueName}, ${query}),
        extensions.similarity(coalesce(${sessions.venueAddress}, ''), ${query})
      )`),
      asc(sessions.startsAt),
    )
    .limit(limit + 1)
    .offset(offset);
  const result = page(rows, limit);
  return {
    more: result.more,
    items: result.rows.map((session): SearchResult => {
      const spots = Math.max(0, session.capacity - Number(session.playerCount));
      const cost =
        session.estimatedCostCents === 0
          ? "Free"
          : session.estimatedCostCents
            ? `${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(session.estimatedCostCents / 100)} est.`
            : null;
      const state = session.membershipRsvp
        ? session.membershipRsvp === "pending"
          ? "Pending approval"
          : session.membershipRsvp.charAt(0).toUpperCase() + session.membershipRsvp.slice(1)
        : spots
          ? `${spots} ${spots === 1 ? "spot" : "spots"} left`
          : "Waitlist open";
      return {
        id: session.id,
        type: "games",
        title: session.title,
        subtitle: [
          formatSessionDate(session.startsAt),
          session.venueName,
          cost,
          state,
          session.requiresApproval && !session.membershipId ? "Approval required" : null,
        ]
          .filter(Boolean)
          .join(" · "),
        href:
          session.visibility === "private" || session.membershipId
            ? `/games/${session.id}`
            : `/s/${session.slug}?source=search`,
        accentColor: session.accentColor,
      };
    }),
  };
}

async function findPlayers(query: string, offset: number, limit: number) {
  const pattern = `%${likeValue(query)}%`;
  const prefix = `${likeValue(query)}%`;
  const rows = await db
    .select({
      userId: profiles.userId,
      name: profiles.name,
      username: profiles.username,
      city: profiles.city,
      avatarPath: profiles.avatarPath,
    })
    .from(profiles)
    .innerJoin(users, eq(profiles.userId, users.id))
    .where(
      and(
        isNull(users.suspendedAt),
        isNull(users.deletedAt),
        or(ilike(profiles.name, pattern), ilike(profiles.username, pattern), ilike(profiles.city, pattern)),
      ),
    )
    .orderBy(
      sql`case when lower(${profiles.name}) like lower(${prefix}) or lower(${profiles.username}) like lower(${prefix}) then 0 else 1 end`,
      asc(profiles.name),
    )
    .limit(limit + 1)
    .offset(offset);
  const result = page(rows, limit);
  return {
    more: result.more,
    items: result.rows.map((profile): SearchResult => ({
      id: profile.userId,
      type: "players",
      title: profile.name,
      subtitle: `@${profile.username}${profile.city ? ` · ${profile.city}` : ""}`,
      href: `/profile/${profile.username}`,
      imageUrl: profileAvatarUrl(profile.avatarPath) ?? null,
    })),
  };
}

async function findGroups(userId: string, query: string, offset: number, limit: number) {
  const pattern = `%${likeValue(query)}%`;
  const prefix = `${likeValue(query)}%`;
  const rows = await db
    .select({
      id: groups.id,
      name: groups.name,
      description: groups.description,
      slug: groups.slug,
      imagePath: groups.imagePath,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(and(eq(groupMembers.userId, userId), or(ilike(groups.name, pattern), ilike(groups.description, pattern))))
    .orderBy(sql`case when lower(${groups.name}) like lower(${prefix}) then 0 else 1 end`, asc(groups.name))
    .limit(limit + 1)
    .offset(offset);
  const result = page(rows, limit);
  return {
    more: result.more,
    items: result.rows.map((group): SearchResult => ({
      id: group.id,
      type: "groups",
      title: group.name,
      subtitle: group.description || "Your regular group",
      href: `/groups/${group.slug}`,
      imageUrl: groupImageUrl(group.imagePath) ?? null,
    })),
  };
}

async function findCourts(query: string, offset: number, limit: number) {
  const pattern = `%${likeValue(query)}%`;
  const prefix = `${likeValue(query)}%`;
  const rows = await db
    .select({ id: venues.id, name: venues.name, address: venues.address, slug: venues.slug })
    .from(venues)
    .where(and(eq(venues.listingStatus, "verified"), or(ilike(venues.name, pattern), ilike(venues.address, pattern))))
    .orderBy(sql`case when lower(${venues.name}) like lower(${prefix}) then 0 else 1 end`, asc(venues.name))
    .limit(limit + 1)
    .offset(offset);
  const result = page(rows, limit);
  return {
    more: result.more,
    items: result.rows.map((venue): SearchResult => ({
      id: venue.id,
      type: "courts",
      title: venue.name,
      subtitle: venue.address,
      href: `/court/${venue.slug}`,
    })),
  };
}

export async function searchRelay(
  userId: string,
  query: string,
  filter: SearchFilter,
  cursor: number,
): Promise<SearchResponse> {
  const pageSize = filter === "all" ? 5 : 20;
  const requested = filter === "all" ? (["games", "players", "groups", "courts"] as const) : [filter];
  const results = await Promise.all(
    requested.map((type) => {
      if (type === "games") return findGames(userId, query, cursor, pageSize);
      if (type === "players") return findPlayers(query, cursor, pageSize);
      if (type === "groups") return findGroups(userId, query, cursor, pageSize);
      return findCourts(query, cursor, pageSize);
    }),
  );
  return {
    items: results.flatMap((result) => result.items),
    nextCursor: results.some((result) => result.more) ? cursor + pageSize : null,
  };
}
