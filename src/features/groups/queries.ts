import "server-only";

import { and, asc, count, desc, eq, gt, inArray, lt, or } from "drizzle-orm";
import { db } from "@/db/client";
import { groupMembers, groups, sessions } from "@/db/schema";
import { formatSessionDate } from "@/features/sessions/format";
import {
  groupCollectionCondition,
  groupCollectionOrder,
  groupFilterContext,
} from "./collection-query";
import { defaultGroupFilters, type GroupFilters } from "./filters";

import type { GroupCollectionItem } from "./group-collection";
import { groupImageUrl } from "./image";
import { encodeGroupCursor, type GroupCursor } from "./pagination";

const GROUP_PAGE_SIZE = 24;

export type GroupCollectionPage = {
  items: GroupCollectionItem[];
  nextCursor: string | null;
};

export async function getGroupCollectionPage(
  userId: string,
  cursor: GroupCursor | null = null,
  filters: GroupFilters = defaultGroupFilters
): Promise<GroupCollectionPage> {
  const context = groupFilterContext(userId, filters);
  if (
    cursor &&
    (cursor.context !== context ||
      cursor.upcoming === undefined ||
      !cursor.snapshot)
  )
    throw new Error("Group cursor does not match these filters.");
  const snapshot = cursor?.snapshot ?? new Date().toISOString();
  const now = new Date(snapshot);
  const order = groupCollectionOrder(now);
  const cursorCondition = cursor
    ? or(
        cursor.upcoming ? eq(order.upcoming, false) : undefined,
        and(
          eq(order.upcoming, cursor.upcoming!),
          or(
            lt(order.activity, cursor.at.toISOString()),
            and(
              eq(order.activity, cursor.at.toISOString()),
              gt(groups.id, cursor.id)
            )
          )
        )
      )
    : undefined;
  const memberships = await db
    .select({
      group: groups,
      member: groupMembers,
      upcoming: order.upcoming,
      activity: order.activity,
    })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(and(groupCollectionCondition(userId, filters), cursorCondition))
    .orderBy(desc(order.upcoming), desc(order.activity), asc(groups.id))
    .limit(GROUP_PAGE_SIZE + 1);
  const hasMore = memberships.length > GROUP_PAGE_SIZE;
  const pageRows = memberships.slice(0, GROUP_PAGE_SIZE);
  const groupIds = pageRows.map(({ group }) => group.id);
  const [memberCounts, upcoming] = await Promise.all([
    groupIds.length
      ? db
          .select({ groupId: groupMembers.groupId, total: count() })
          .from(groupMembers)
          .where(inArray(groupMembers.groupId, groupIds))
          .groupBy(groupMembers.groupId)
      : [],
    groupIds.length
      ? db
          .selectDistinctOn([sessions.groupId])
          .from(sessions)
          .where(
            and(
              inArray(sessions.groupId, groupIds),
              inArray(sessions.status, ["published", "live"]),
              gt(sessions.endsAt, now)
            )
          )
          .orderBy(sessions.groupId, asc(sessions.startsAt), asc(sessions.id))
      : [],
  ]);
  const counts = new Map(
    memberCounts.map(({ groupId, total }) => [groupId, Number(total)])
  );
  const nextByGroup = new Map(
    upcoming.flatMap((session) =>
      session.groupId ? [[session.groupId, session] as const] : []
    )
  );
  const last = pageRows.at(-1);

  return {
    items: pageRows.map(({ group, member }) => {
      const next = nextByGroup.get(group.id);
      return {
        id: group.id,
        href: `/groups/${group.slug}`,
        name: group.name,
        initials: group.name.slice(0, 2).toUpperCase(),
        imageUrl: groupImageUrl(group.imagePath),
        memberCount: counts.get(group.id) ?? 1,
        role: group.ownerId === userId ? "owner" : member.role,
        nextGameDate: next ? formatSessionDate(next.startsAt) : undefined,
        accentColor: next?.accentColor,
      };
    }),
    nextCursor:
      hasMore && last
        ? encodeGroupCursor({
            at: last.activity,
            id: last.group.id,
            upcoming: last.upcoming,
            context,
            snapshot,
          })
        : null,
  };
}
