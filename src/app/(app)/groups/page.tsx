import Link from "next/link";
import { and, asc, count, eq, gte, inArray, or } from "drizzle-orm";
import { CaretRight, Plus, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { groupMembers, groups, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { formatSessionDate } from "@/features/sessions/format";

export default async function GroupsPage() {
  const user = await requireUser();
  const memberships = await db.select({ group: groups, member: groupMembers }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(eq(groupMembers.userId, user.id));
  const groupIds = memberships.map(({ group }) => group.id);
  const [memberCounts, upcoming] = await Promise.all([
    groupIds.length ? db.select({ groupId: groupMembers.groupId, total: count() }).from(groupMembers).where(inArray(groupMembers.groupId, groupIds)).groupBy(groupMembers.groupId) : [],
    groupIds.length ? db.select().from(sessions).where(and(inArray(sessions.groupId, groupIds), or(eq(sessions.status, "live"), and(eq(sessions.status, "published"), gte(sessions.startsAt, new Date()))))).orderBy(asc(sessions.startsAt)) : [],
  ]);
  const counts = new Map(memberCounts.map(({ groupId, total }) => [groupId, Number(total)]));

  return <div className="max-w-4xl"><header className="flex items-end justify-between gap-4"><div><h1 className="app-title">Groups</h1><p className="mt-2 max-w-xl text-muted">Regular crews, faster invites, and game-night history.</p></div><ButtonLink href="/groups/new" variant="secondary"><Plus aria-hidden size={16} />New group</ButtonLink></header>{memberships.length ? <section className="mt-9 max-w-3xl divide-y divide-line border-y border-line">{memberships.map(({ group, member }) => { const next = upcoming.find((session) => session.groupId === group.id); return <Link href={`/groups/${group.slug}`} key={group.id} style={next ? sessionAccentStyle(next.accentColor) : undefined} className="collection-row group flex min-h-20 items-center gap-4 py-4 sm:px-2"><span aria-hidden className="grid h-11 w-11 place-items-center rounded-full bg-surface-strong text-sm font-bold text-ink">{group.name.slice(0, 2).toUpperCase()}</span><div className="min-w-0 flex-1"><h2 className="truncate font-[680]">{group.name}</h2><p className="mt-1 truncate text-sm text-muted">{counts.get(group.id) ?? 1} members · {next ? `Next game ${formatSessionDate(next.startsAt)}` : "No upcoming game"}</p></div><span className="hidden text-xs capitalize text-muted sm:block">{member.role}</span><CaretRight aria-hidden className="text-muted transition-transform group-hover:translate-x-0.5" size={16} /></Link>; })}</section> : <section className="mt-10 border-y border-line lg:grid lg:grid-cols-[1fr_1fr]"><div className="py-8 lg:border-r lg:border-line lg:pr-12"><UsersThree className="text-primary" size={24} weight="regular" /><h2 className="mt-5 max-w-sm text-2xl font-[720] tracking-[-0.025em]">Keep the regular crew together.</h2><p className="mt-3 max-w-md leading-7 text-muted">Start with a standalone game. After everyone plays, save the crew so the next invite takes less work.</p><div className="mt-6 flex flex-wrap gap-2"><ButtonLink href="/games/new">Create a game</ButtonLink><ButtonLink href="/groups/new" variant="secondary">Create a group</ButtonLink></div></div><dl className="divide-y divide-line py-2 lg:py-5 lg:pl-12"><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Members</dt><dd className="text-sm leading-5 text-muted">Signed-in players ready to invite again.</dd></div><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Games</dt><dd className="text-sm leading-5 text-muted">Upcoming plans and past sessions in one place.</dd></div><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Memories</dt><dd className="text-sm leading-5 text-muted">Photos and results kept with the people who played.</dd></div></dl></section>}</div>;
}
