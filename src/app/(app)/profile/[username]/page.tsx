import { and, eq } from "drizzle-orm";
import { CalendarDays, ChevronRight, MapPin, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar-stack";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { Button } from "@/components/ui/button";
import { db } from "@/db/client";
import { matchPlayers, matches, profiles, sessionPlayers } from "@/db/schema";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { formatSessionDate } from "@/features/sessions/format";
import { getUserSessions } from "@/features/sessions/queries";

export default async function ProfilePage({ params }: { params: Promise<{ username: string }> }) {
  const [profile, viewer] = await Promise.all([db.query.profiles.findFirst({ where: eq(profiles.username, (await params).username) }), getCurrentUser()]);
  if (!profile) notFound();
  const [sessionCount, participation, sessionRows] = await Promise.all([
    db.$count(sessionPlayers, and(eq(sessionPlayers.userId, profile.userId), eq(sessionPlayers.rsvp, "going"))),
    db.select({ match: matches, player: matchPlayers }).from(matchPlayers).innerJoin(matches, eq(matchPlayers.matchId, matches.id)).innerJoin(sessionPlayers, eq(matchPlayers.sessionPlayerId, sessionPlayers.id)).where(and(eq(sessionPlayers.userId, profile.userId), eq(matches.status, "completed"))),
    getUserSessions(profile.userId),
  ]);
  const wins = participation.filter(({ match, player }) => match.winningTeam === player.team).length;
  const recent = sessionRows.slice(-5).reverse();
  const ownProfile = viewer?.id === profile.userId;

  return <div className="mx-auto max-w-3xl space-y-10">
    <section className="overflow-hidden rounded-2xl bg-surface-strong">
      <header className="flex items-center gap-4 p-5 sm:p-7"><Avatar name={profile.name} size="lg" /><div className="min-w-0 flex-1"><p className="sport-label text-primary">Player profile</p><h1 className="mt-1 truncate text-2xl font-[760] tracking-[-0.025em] sm:text-3xl">{profile.name}</h1>{profile.city ? <p className="mt-1.5 flex items-center gap-1.5 text-sm text-muted"><MapPin size={15} strokeWidth={2.4} />{profile.city}{profile.dominantHand ? ` · ${profile.dominantHand}-handed` : ""}</p> : <p className="mt-1.5 text-sm text-muted">@{profile.username}</p>}</div></header>
      <div className="grid grid-cols-3 border-t border-line bg-surface px-2 py-5 text-center"><div className="border-r border-line"><strong className="score block text-2xl font-[760] sm:text-3xl">{sessionCount}</strong><span className="text-xs font-[650] text-muted sm:text-sm">Sessions</span></div><div className="border-r border-line"><strong className="score block text-2xl font-[760] sm:text-3xl">{participation.length}</strong><span className="text-xs font-[650] text-muted sm:text-sm">Matches</span></div><div><strong className="score block text-2xl font-[760] sm:text-3xl">{wins}</strong><span className="text-xs font-[650] text-muted sm:text-sm">Wins</span></div></div>
      <p className="border-t border-line bg-surface px-5 py-3 text-center text-xs leading-5 text-muted">Just-for-fun memories with friends—not a competitive rating.</p>
    </section>

    <section aria-labelledby="recent-sessions"><div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-primary-soft text-primary"><CalendarDays size={21} strokeWidth={2.5} /></span><div><h2 id="recent-sessions" className="text-lg font-[740]">Recent sessions</h2><p className="text-sm text-muted">The games worth running back.</p></div></div>{recent.length ? <ul className="divide-y divide-line border-y border-line">{recent.map(({ session }) => <li key={session.id}><Link href={`/games/${session.id}`} prefetch={false} className="pressable flex min-h-20 items-center gap-3 py-4 hover:bg-surface-strong sm:px-3"><time className="score w-16 shrink-0 text-xs font-bold text-primary">{formatSessionDate(session.startsAt)}</time><div className="min-w-0 flex-1"><p className="truncate font-[680]">{session.title}</p><p className="mt-1 truncate text-sm text-muted">{session.venueName}</p></div><ChevronRight aria-hidden className="text-muted" size={19} strokeWidth={2.4} /></Link></li>)}</ul> : <div className="rounded-2xl bg-surface-strong px-5 py-7"><p className="font-[680]">No sessions yet</p><p className="mt-1 text-sm text-muted">Your first game will stay here after you join.</p></div>}</section>

    {ownProfile ? <section aria-labelledby="profile-settings" className="border-t border-line pt-8"><div className="mb-4 flex items-center gap-3"><span className="grid h-10 w-10 place-items-center rounded-xl bg-surface-strong text-ink"><SlidersHorizontal size={20} strokeWidth={2.5} /></span><div><h2 id="profile-settings" className="text-lg font-[740]">Settings</h2><p className="text-sm text-muted">Appearance and account.</p></div></div><div className="divide-y divide-line rounded-2xl bg-surface-strong px-2"><ThemeToggle showLabel className="px-3" /><form action={signOut} className="py-2"><Button variant="quiet" className="w-full justify-start">Sign out</Button></form></div></section> : null}
  </div>;
}
