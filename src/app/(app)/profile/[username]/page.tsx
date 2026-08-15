import { and, eq } from "drizzle-orm";
import { MapPin } from "lucide-react";
import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar-stack";
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
  return <div className="mx-auto max-w-3xl"><header className="flex items-center gap-4 border-b border-line pb-7"><Avatar name={profile.name} size="lg" /><div className="flex-1"><h1 className="text-2xl font-[720] tracking-[-0.02em]">{profile.name}</h1>{profile.city ? <p className="mt-1 flex items-center gap-1 text-sm text-muted"><MapPin size={14} />{profile.city}{profile.dominantHand ? ` · ${profile.dominantHand}-handed` : ""}</p> : <p className="mt-1 text-sm text-muted">@{profile.username}</p>}</div></header><section className="grid grid-cols-3 border-b border-line py-6 text-center"><div><strong className="score block text-2xl">{sessionCount}</strong><span className="text-sm text-muted">Sessions</span></div><div><strong className="score block text-2xl">{participation.length}</strong><span className="text-sm text-muted">Matches</span></div><div><strong className="score block text-2xl">{wins}</strong><span className="text-sm text-muted">Wins</span></div></section><p className="border-b border-line pb-6 text-center text-xs leading-5 text-muted">A just-for-fun record of games with friends—not a competitive rating.</p><section className="py-8"><h2 className="text-lg font-bold">Recent sessions</h2>{recent.length ? <ul className="mt-3 divide-y divide-line border-y border-line">{recent.map(({ session }) => <li key={session.id} className="flex items-center justify-between py-4"><div><p className="font-semibold">{session.title}</p><p className="mt-1 text-sm text-muted">{formatSessionDate(session.startsAt)} · {session.venueName}</p></div></li>)}</ul> : <p className="mt-3 border-y border-line py-7 text-sm text-muted">No sessions yet. The first one will show up here.</p>}</section>{viewer?.id === profile.userId ? <form action={signOut} className="border-t border-line pt-6"><Button variant="secondary">Sign out</Button></form> : null}</div>;
}
