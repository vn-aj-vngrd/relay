import { createHash } from "node:crypto";
import { and, eq, ilike, ne, sql } from "drizzle-orm";
import { groupMembers, groups, sessions } from "@/db/schema";
import { type GroupFilters, groupFilterParams } from "./filters";

export function groupFilterContext(userId: string, filters: GroupFilters) {
  return createHash("sha256")
    .update(`${userId}:${groupFilterParams(filters)}`)
    .digest("hex");
}
export function groupCollectionCondition(
  userId: string,
  filters: GroupFilters
) {
  const search = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
  return and(
    eq(groupMembers.userId, userId),
    filters.q ? ilike(groups.name, search) : undefined,
    filters.role === "owner"
      ? eq(groups.ownerId, userId)
      : filters.role === "member"
        ? ne(groups.ownerId, userId)
        : undefined
  );
}
export function groupCollectionOrder(now: Date) {
  const upcoming = sql<boolean>`exists (select 1 from ${sessions} where ${sessions.groupId} = ${groups.id} and ${sessions.status} in ('published', 'live') and ${sessions.endsAt} > ${now.toISOString()}::timestamptz)`;
  const activity =
    sql<Date>`greatest(${groups.updatedAt}, coalesce((select max(${sessions.updatedAt}) from ${sessions} where ${sessions.groupId} = ${groups.id} and ${sessions.status} in ('published', 'live', 'completed', 'cancelled')), ${groups.createdAt}))`.mapWith(
      groups.updatedAt
    );
  return { upcoming, activity };
}
