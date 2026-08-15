import { eq } from "drizzle-orm";
import { UsersRound } from "lucide-react";
import { db } from "@/db/client";
import { groupMembers, groups } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

export default async function GroupsPage() {
  const user = await requireUser();
  const memberships = await db.select({ group: groups, member: groupMembers }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(eq(groupMembers.userId, user.id));
  return <div><div className="flex items-end justify-between"><div><h1 className="text-[28px] font-bold tracking-[-0.035em] sm:text-4xl">Groups</h1><p className="mt-2 text-muted">Your regular crews.</p></div></div>{memberships.length ? <section className="mt-9 max-w-2xl divide-y divide-line border-y border-line">{memberships.map(({ group, member }) => <article key={group.id} className="flex items-center gap-4 py-5"><span className="grid h-12 w-12 place-items-center rounded-xl bg-primary-soft text-primary"><UsersRound /></span><div><h2 className="font-bold">{group.name}</h2><p className="mt-1 text-sm text-muted">{member.role === "member" ? "Member" : member.role}</p></div></article>)}</section> : <section className="mt-9 max-w-xl border-y border-line py-10"><UsersRound className="text-primary" /><h2 className="mt-4 text-xl font-bold">No groups yet</h2><p className="mt-2 text-pretty text-muted">Groups make it faster to invite the same crew, but every game can still stand on its own.</p><p className="mt-5 text-sm font-medium text-muted">Group creation is coming after your first session.</p></section>}</div>;
}
