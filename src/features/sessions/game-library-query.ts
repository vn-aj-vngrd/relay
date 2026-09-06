import {
  and,
  eq,
  gt,
  gte,
  ilike,
  inArray,
  isNull,
  lte,
  ne,
  or,
  sql,
} from "drizzle-orm";
import { profiles, sessionPlayers, sessions } from "@/db/schema";
import type { GameCollectionPhase } from "./game-collection-types";
import {
  type GameLibraryFilters,
  gameLibraryRangeError,
} from "./game-library-filters";

// Every predicate (including facet options) starts from this account's membership.
// Drafts and removed memberships never enter the library.
export function gameLibraryMembership(userId: string) {
  return and(
    eq(sessionPlayers.userId, userId),
    isNull(sessionPlayers.leftAt),
    inArray(sessions.status, ["published", "live", "completed", "cancelled"])
  );
}

export function gameLibraryPhase(phase: GameCollectionPhase, now: Date) {
  return phase === "upcoming"
    ? and(
        gt(sessions.endsAt, now),
        inArray(sessions.status, ["published", "live"])
      )
    : or(
        inArray(sessions.status, ["completed", "cancelled"]),
        lte(sessions.endsAt, now)
      );
}

export function gameLibraryConditions(
  userId: string,
  filters: GameLibraryFilters,
  now: Date
) {
  const search = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
  // Dates use each game's own timezone, just like its list and calendar label.
  const localDate = sql`(${sessions.startsAt} at time zone ${sessions.timezone})::date`;
  return and(
    gameLibraryMembership(userId),
    // Unanswered invitations have their own independent, actionable collection.
    or(
      ne(sessionPlayers.rsvp, "invited"),
      eq(sessions.hostId, userId),
      eq(sessionPlayers.role, "cohost")
    ),
    filters.cancelled === "false"
      ? ne(sessions.status, "cancelled")
      : undefined,
    filters.when === "upcoming" || filters.when === "past"
      ? gameLibraryPhase(filters.when, now)
      : undefined,
    filters.role === "host"
      ? eq(sessions.hostId, userId)
      : filters.role === "cohost"
        ? and(ne(sessions.hostId, userId), eq(sessionPlayers.role, "cohost"))
        : filters.role === "player"
          ? and(ne(sessions.hostId, userId), eq(sessionPlayers.role, "player"))
          : undefined,
    filters.response !== "any"
      ? eq(sessionPlayers.rsvp, filters.response)
      : undefined,
    filters.group === "none"
      ? isNull(sessions.groupId)
      : filters.group !== "any"
        ? eq(sessions.groupId, filters.group)
        : undefined,
    filters.venue ? eq(sessions.venueName, filters.venue) : undefined,
    filters.q
      ? or(
          ilike(sessions.title, search),
          ilike(sessions.venueName, search),
          sql`exists (select 1 from ${profiles} where ${profiles.userId} = ${sessions.hostId} and ${ilike(profiles.name, search)})`
        )
      : undefined,
    gameLibraryRangeError(filters) ? sql`false` : undefined,
    filters.when === "range" && filters.from
      ? gte(localDate, filters.from)
      : undefined,
    filters.when === "range" && filters.until
      ? lte(localDate, filters.until)
      : undefined
  );
}
