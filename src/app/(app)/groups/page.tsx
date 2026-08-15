import { eq } from "drizzle-orm";
import { CalendarPlus, RotateCcw, UserPlus, UsersRound } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { db } from "@/db/client";
import { groupMembers, groups } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

export default async function GroupsPage() {
  const user = await requireUser();
  const memberships = await db.select({ group: groups, member: groupMembers }).from(groupMembers).innerJoin(groups, eq(groupMembers.groupId, groups.id)).where(eq(groupMembers.userId, user.id));

  return <div className="max-w-4xl">
    <header className="flex items-end justify-between gap-4"><div><p className="sport-label text-primary">Your crews</p><h1 className="app-title mt-1">Groups</h1><p className="mt-2 max-w-xl text-muted">Keep the people you play with often within easy reach.</p></div></header>

    {memberships.length ? <section className="mt-9 grid gap-4 sm:grid-cols-2">{memberships.map(({ group, member }) => <article key={group.id} className="group overflow-hidden rounded-2xl border border-line bg-surface"><div className="h-1.5 bg-primary" /><div className="flex items-center gap-4 p-5"><span className="grid h-14 w-14 shrink-0 place-items-center rounded-2xl bg-primary-soft text-primary"><UsersRound size={26} strokeWidth={2.5} /></span><div className="min-w-0 flex-1"><h2 className="truncate text-lg font-[740]">{group.name}</h2><p className="mt-1 text-sm capitalize text-muted">{member.role}</p></div></div></article>)}</section> : <section className="mt-9 overflow-hidden rounded-2xl bg-surface-strong"><div className="grid lg:grid-cols-[.9fr_1.1fr]"><div className="p-6 sm:p-8 lg:border-r lg:border-line"><span className="grid h-14 w-14 place-items-center rounded-2xl bg-primary text-white"><UsersRound size={27} strokeWidth={2.6} /></span><h2 className="mt-6 text-2xl font-[750] tracking-[-0.025em]">Your regular crew,<br />ready for the next game.</h2><p className="mt-3 max-w-md leading-7 text-muted">Groups save the familiar players and game history. Standalone sessions still work perfectly without one.</p><ButtonLink href="/games/new" className="mt-6"><CalendarPlus size={18} strokeWidth={2.5} />Create a game</ButtonLink></div><div className="bg-surface px-6 py-3 sm:px-8 lg:py-6"><ol className="divide-y divide-line"><li className="flex gap-4 py-5"><UserPlus className="mt-0.5 shrink-0 text-primary" size={22} strokeWidth={2.5} /><div><p className="font-[700]">Gather naturally</p><p className="mt-1 text-sm leading-5 text-muted">Start with a session and invite the friends who actually play.</p></div></li><li className="flex gap-4 py-5"><RotateCcw className="mt-0.5 shrink-0 text-primary" size={22} strokeWidth={2.5} /><div><p className="font-[700]">Play again faster</p><p className="mt-1 text-sm leading-5 text-muted">Reuse the venue, capacity, courts, and familiar invite list.</p></div></li><li className="flex gap-4 py-5"><UsersRound className="mt-0.5 shrink-0 text-primary" size={22} strokeWidth={2.5} /><div><p className="font-[700]">Keep shared history</p><p className="mt-1 text-sm leading-5 text-muted">Upcoming games and memories stay connected to the crew.</p></div></li></ol></div></div></section>}
  </div>;
}
