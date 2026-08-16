import { eq } from "drizzle-orm";
import { UsersThree } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { groupMembers, groups } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

export default async function GroupsPage() {
  const user = await requireUser();
  const memberships = await db.select({ group: groups, member: groupMembers }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(eq(groupMembers.userId, user.id));

  return <div className="max-w-4xl"><header><h1 className="app-title">Groups</h1><p className="mt-2 max-w-xl text-muted">The friends you play with regularly.</p></header>{memberships.length ? <section className="mt-9 max-w-2xl divide-y divide-line border-y border-line">{memberships.map(({ group, member }) => <article key={group.id} className="flex items-center gap-4 py-5"><span aria-hidden className="grid h-12 w-12 place-items-center rounded-full bg-ink text-sm font-bold text-surface">{group.name.slice(0, 2).toUpperCase()}</span><div><h2 className="font-[680]">{group.name}</h2><p className="mt-1 text-sm capitalize text-muted">{member.role}</p></div></article>)}</section> : <section className="mt-10 border-y border-line lg:grid lg:grid-cols-[1fr_1fr]"><div className="py-8 lg:border-r lg:border-line lg:pr-12"><UsersThree className="text-primary" size={24} weight="regular" /><h2 className="mt-5 max-w-sm text-2xl font-[720] tracking-[-0.025em]">Keep the regular crew together.</h2><p className="mt-3 max-w-md leading-7 text-muted">Start with a standalone game. When the same friends keep showing up, a group makes the next invite faster.</p><ButtonLink href="/games/new" className="mt-6">Create a game</ButtonLink></div><dl className="divide-y divide-line py-2 lg:py-5 lg:pl-12"><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Members</dt><dd className="text-sm leading-5 text-muted">Your familiar invite list, ready to reuse.</dd></div><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Games</dt><dd className="text-sm leading-5 text-muted">Upcoming plans and past sessions in one place.</dd></div><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Memories</dt><dd className="text-sm leading-5 text-muted">Photos and results kept with the people who played.</dd></div></dl></section>}</div>;
}
