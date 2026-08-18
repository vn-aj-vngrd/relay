import { CaretRight, Lifebuoy, MapPin, ShieldCheck, SignOut, SlidersHorizontal } from "@phosphor-icons/react/dist/ssr";
import { and, eq } from "drizzle-orm";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar-stack";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { db } from "@/db/client";
import { matchPlayers, matches, profiles, sessionPlayers } from "@/db/schema";
import { isAdminEmail } from "@/features/admin/auth";
import { signOut } from "@/features/auth/actions";
import { getCurrentUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { ProfileAvatarEditor } from "@/features/players/profile-avatar-editor";
import { sessionAccentStyle } from "@/features/sessions/accent";
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
  const imageUrl = profileAvatarUrl(profile.avatarPath);

  return <div className="mx-auto w-full max-w-4xl"><header className="flex items-start gap-4 pb-7">{ownProfile ? <ProfileAvatarEditor name={profile.name} imageUrl={imageUrl} /> : <Avatar name={profile.name} imageUrl={imageUrl} size="xl" />}<div className="min-w-0 flex-1 pt-1"><h1 className="truncate text-[1.75rem] font-[680] tracking-[-0.025em]">{profile.name}</h1>{profile.city ? <p className="mt-1 flex items-center gap-1.5 text-sm text-muted"><MapPin size={15} />{profile.city}{profile.dominantHand ? ` · ${profile.dominantHand}-handed` : ""}</p> : <p className="mt-1 text-sm text-muted">@{profile.username}</p>}</div></header>

    <section aria-label="Playing history" className="grid grid-cols-3 border-y border-line py-5 text-center"><div><strong className="score block text-2xl">{sessionCount}</strong><span className="text-xs font-medium text-muted sm:text-sm">Sessions</span></div><div className="border-x border-line"><strong className="score block text-2xl">{participation.length}</strong><span className="text-xs font-medium text-muted sm:text-sm">Matches</span></div><div><strong className="score block text-2xl">{wins}</strong><span className="text-xs font-medium text-muted sm:text-sm">Wins</span></div></section><p className="pt-3 text-center text-xs leading-5 text-muted">For fun, not a competitive rating.</p>

    <section className="py-10" aria-labelledby="recent-title"><div className="mb-3"><h2 id="recent-title" className="text-lg font-[680]">Recent sessions</h2><p className="mt-1 text-sm text-muted">Games you played with friends.</p></div>{recent.length ? <ul className="divide-y divide-line border-y border-line">{recent.map(({ session }) => <li key={session.id}><Link href={`/games/${session.id}`} prefetch={false} style={sessionAccentStyle(session.accentColor)} className="pressable flex min-h-20 items-center gap-4 py-4 hover:bg-surface-strong sm:px-2"><time className="score w-20 shrink-0 text-xs font-semibold text-primary">{formatSessionDate(session.startsAt)}</time><div className="min-w-0 flex-1"><p className="truncate font-semibold">{session.title}</p><p className="mt-1 truncate text-sm text-muted">{session.venueName}</p></div><CaretRight aria-hidden className="text-muted" size={16} /></Link></li>)}</ul> : <div className="border-y border-line py-7"><p className="font-semibold">No sessions yet</p><p className="mt-1 text-sm text-muted">Your first game will show up here.</p></div>}</section>

    {ownProfile ? <section aria-labelledby="account-title" className="pb-6"><h2 id="account-title" className="mb-2 text-sm font-semibold">Account</h2><div className="divide-y divide-line border-y border-line"><Link href="/preferences" className="flex min-h-12 items-center gap-3 py-2 text-sm"><SlidersHorizontal size={18} className="text-muted" /><span className="flex-1">Preferences</span><CaretRight size={15} className="text-muted" /></Link><Link href="/help" className="flex min-h-12 items-center gap-3 py-2 text-sm"><Lifebuoy size={18} className="text-muted" /><span className="flex-1">Help Center</span><CaretRight size={15} className="text-muted" /></Link>{isAdminEmail(viewer?.email) ? <Link href="/admin" className="flex min-h-12 items-center gap-3 py-2 text-sm"><ShieldCheck size={18} className="text-muted" /><span className="flex-1">Admin console</span><CaretRight size={15} className="text-muted" /></Link> : null}<form action={signOut}><PendingSubmit pendingLabel="Signing out…" className="flex min-h-12 w-full items-center gap-3 py-2 text-sm"><SignOut size={18} className="text-muted" />Sign out</PendingSubmit></form></div></section> : null}
  </div>;
}
