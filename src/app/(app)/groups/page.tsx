import { Plus } from "@phosphor-icons/react/dist/ssr";
import { and, asc, count, eq, gte, inArray, or } from "drizzle-orm";

import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { groupMembers, groups, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { GroupCollection, type GroupCollectionItem, GroupViewMenu } from "@/features/groups/group-collection";
import { formatSessionDate } from "@/features/sessions/format";

export default async function GroupsPage() {
  const user = await requireUser();
  const memberships = await db
    .select({ group: groups, member: groupMembers })
    .from(groupMembers)
    .innerJoin(groups, eq(groupMembers.groupId, groups.id))
    .where(eq(groupMembers.userId, user.id));
  const groupIds = memberships.map(({ group }) => group.id);
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
          .select()
          .from(sessions)
          .where(
            and(
              inArray(sessions.groupId, groupIds),
              or(
                eq(sessions.status, "live"),
                and(eq(sessions.status, "published"), gte(sessions.startsAt, new Date())),
              ),
            ),
          )
          .orderBy(asc(sessions.startsAt))
      : [],
  ]);
  const counts = new Map(memberCounts.map(({ groupId, total }) => [groupId, Number(total)]));
  const nextByGroup = new Map<string, (typeof upcoming)[number]>();
  upcoming.forEach((session) => {
    if (session.groupId && !nextByGroup.has(session.groupId)) nextByGroup.set(session.groupId, session);
  });
  const items: GroupCollectionItem[] = memberships.map(({ group, member }) => {
    const next = nextByGroup.get(group.id);
    return {
      id: group.id,
      href: `/groups/${group.slug}`,
      name: group.name,
      initials: group.name.slice(0, 2).toUpperCase(),
      memberCount: counts.get(group.id) ?? 1,
      role: member.role,
      nextGameDate: next ? formatSessionDate(next.startsAt) : undefined,
      accentColor: next?.accentColor,
    };
  });

  return (
    <div>
      <header className="flex items-center justify-between gap-4 sm:items-end">
        <div>
          <h1 className="app-title">Groups</h1>
          <p className="mt-2 hidden max-w-xl text-muted sm:block">
            Regular crews, faster invites, and game-night history.
          </p>
        </div>
        <GroupViewMenu />
        <span className="hidden sm:block">
          <ButtonLink href="/groups/new">
            <Plus aria-hidden size={16} />
            Create group
          </ButtonLink>
        </span>
      </header>
      <GroupCollection items={items} />
    </div>
  );
}
