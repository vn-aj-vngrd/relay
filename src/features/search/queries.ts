import "server-only";

import { and, asc, eq, ilike, inArray, isNotNull, isNull, or, sql } from "drizzle-orm";
import { db } from "@/db/client";
import { groupMembers, groups, profiles, sessionPlayers, sessions, users, venues } from "@/db/schema";
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
  const rows = await db.select({ session: sessions, membershipId: sessionPlayers.id }).from(sessions)
    .leftJoin(sessionPlayers, and(eq(sessionPlayers.sessionId, sessions.id), eq(sessionPlayers.userId, userId), inArray(sessionPlayers.rsvp, ["invited", "pending", "going", "maybe", "waitlisted"])))
    .where(and(
      inArray(sessions.status, ["published", "live", "completed"]),
      or(eq(sessions.visibility, "public"), eq(sessions.hostId, userId), isNotNull(sessionPlayers.id)),
      or(ilike(sessions.title, pattern), ilike(sessions.venueName, pattern), ilike(sessions.venueAddress, pattern)),
    ))
    .orderBy(sql`case when lower(${sessions.title}) like lower(${prefix}) then 0 else 1 end`, asc(sessions.startsAt))
    .limit(limit + 1).offset(offset);
  const result = page(rows, limit);
  return { more: result.more, items: result.rows.map(({ session, membershipId }): SearchResult => ({
    id: session.id,
    type: "games",
    title: session.title,
    subtitle: `${formatSessionDate(session.startsAt)} · ${session.venueName}`,
    href: session.visibility === "private" || membershipId ? `/games/${session.id}` : `/s/${session.slug}`,
    accentColor: session.accentColor,
  })) };
}

async function findPlayers(query: string, offset: number, limit: number) {
  const pattern = `%${likeValue(query)}%`;
  const prefix = `${likeValue(query)}%`;
  const rows = await db.select({ profile: profiles }).from(profiles).innerJoin(users, eq(profiles.userId, users.id)).where(and(isNull(users.suspendedAt), isNull(users.deletedAt), or(ilike(profiles.name, pattern), ilike(profiles.username, pattern), ilike(profiles.city, pattern))))
    .orderBy(sql`case when lower(${profiles.name}) like lower(${prefix}) or lower(${profiles.username}) like lower(${prefix}) then 0 else 1 end`, asc(profiles.name))
    .limit(limit + 1).offset(offset);
  const result = page(rows, limit);
  return { more: result.more, items: result.rows.map(({ profile }): SearchResult => ({ id: profile.userId, type: "players", title: profile.name, subtitle: `@${profile.username}${profile.city ? ` · ${profile.city}` : ""}`, href: `/profile/${profile.username}`, imageUrl: profileAvatarUrl(profile.avatarPath) ?? null })) };
}

async function findGroups(userId: string, query: string, offset: number, limit: number) {
  const pattern = `%${likeValue(query)}%`;
  const prefix = `${likeValue(query)}%`;
  const rows = await db.select({ group: groups }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(and(eq(groupMembers.userId, userId), or(ilike(groups.name, pattern), ilike(groups.description, pattern))))
    .orderBy(sql`case when lower(${groups.name}) like lower(${prefix}) then 0 else 1 end`, asc(groups.name))
    .limit(limit + 1).offset(offset);
  const result = page(rows, limit);
  return { more: result.more, items: result.rows.map(({ group }): SearchResult => ({ id: group.id, type: "groups", title: group.name, subtitle: group.description || "Your regular crew", href: `/groups/${group.slug}` })) };
}

async function findVenues(query: string, offset: number, limit: number) {
  const pattern = `%${likeValue(query)}%`;
  const prefix = `${likeValue(query)}%`;
  const rows = await db.select().from(venues).where(or(ilike(venues.name, pattern), ilike(venues.address, pattern), sql<boolean>`array_to_string(${venues.amenities}, ' ') ilike ${pattern}`))
    .orderBy(sql`case when lower(${venues.name}) like lower(${prefix}) then 0 else 1 end`, asc(venues.name))
    .limit(limit + 1).offset(offset);
  const result = page(rows, limit);
  return { more: result.more, items: result.rows.map((venue): SearchResult => ({ id: venue.id, type: "venues", title: venue.name, subtitle: venue.address, href: `/venues/${venue.slug}` })) };
}

export async function searchRelay(userId: string, query: string, filter: SearchFilter, cursor: number): Promise<SearchResponse> {
  const pageSize = filter === "all" ? 5 : 20;
  const requested = filter === "all" ? (["games", "players", "groups", "venues"] as const) : [filter];
  const results = await Promise.all(requested.map((type) => {
    if (type === "games") return findGames(userId, query, cursor, pageSize);
    if (type === "players") return findPlayers(query, cursor, pageSize);
    if (type === "groups") return findGroups(userId, query, cursor, pageSize);
    return findVenues(query, cursor, pageSize);
  }));
  return { items: results.flatMap((result) => result.items), nextCursor: results.some((result) => result.more) ? cursor + pageSize : null };
}
