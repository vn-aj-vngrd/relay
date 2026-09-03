import "server-only";

import { and, asc, count, eq, gt, gte, inArray, or } from "drizzle-orm";

import { db } from "@/db/client";
import { groupMembers, groups, sessions } from "@/db/schema";
import { formatSessionDate } from "@/features/sessions/format";

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
  cursor: GroupCursor | null = null
): Promise<GroupCollectionPage> {
  const cursorCondition = cursor
    ? or(
        gt(groupMembers.joinedAt, cursor.at),
        and(
          eq(groupMembers.joinedAt, cursor.at),
          gt(groupMembers.groupId, cursor.id)
        )
      )
    : undefined;
  const memberships = await db
    .select({ group: groups, member: groupMembers })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(and(eq(groupMembers.userId, userId), cursorCondition))
    .orderBy(asc(groupMembers.joinedAt), asc(groupMembers.groupId))
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
              or(
                eq(sessions.status, "live"),
                and(
                  eq(sessions.status, "published"),
                  gte(sessions.startsAt, new Date())
                )
              )
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
  const last = pageRows.at(-1)?.member;

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
        role: member.role,
        nextGameDate: next ? formatSessionDate(next.startsAt) : undefined,
        accentColor: next?.accentColor,
      };
    }),
    nextCursor:
      hasMore && last
        ? encodeGroupCursor({ at: last.joinedAt, id: last.groupId })
        : null,
  };
}
