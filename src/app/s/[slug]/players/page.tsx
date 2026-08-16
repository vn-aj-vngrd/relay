import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar-stack";
import { profileAvatarUrl } from "@/features/players/avatar";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { getPublicSession } from "@/features/sessions/queries";

export default async function PublicPlayersPage({ params }: { params: Promise<{ slug: string }> }) {
  const slug = (await params).slug;
  const data = await getPublicSession(slug);
  if (!data) notFound();
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const waitlist = data.roster.filter(({ player }) => player.rsvp === "waitlisted");
  return <main id="main-content" className="min-h-screen bg-canvas" style={sessionAccentStyle(data.session.accentColor)}><article className="mx-auto max-w-3xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8"><p className="text-sm font-semibold text-primary">{data.session.title}</p><div className="mt-1 flex items-end justify-between"><div><h1 className="app-title">Players</h1><p className="mt-2 text-sm text-muted">{going.length} of {data.session.capacity} spots filled</p></div><span className="score text-2xl font-bold text-primary">{Math.max(0, data.session.capacity - going.length)} left</span></div><ul className="mt-6 divide-y divide-line border-y border-line">{going.map(({ player, profile }, index) => { const name = profile?.name ?? player.guestName ?? "Guest"; return <li key={player.id} className="flex min-h-16 items-center gap-3 py-2"><Avatar name={name} imageUrl={profileAvatarUrl(profile?.avatarPath)} index={index} size="sm" /><span className="flex-1 font-medium">{name}</span><span className="text-xs text-muted">{player.role === "host" ? "Host" : "Going"}</span></li>; })}</ul><section className="mt-10"><h2 className="text-lg font-bold">Waitlist</h2>{waitlist.length ? <ol className="mt-3 divide-y divide-line border-y border-line">{waitlist.map(({ player, profile }, index) => <li key={player.id} className="flex min-h-14 items-center gap-3"><span className="score w-5 text-sm text-muted">{index + 1}</span><span className="font-medium">{profile?.name ?? player.guestName ?? "Guest"}</span></li>)}</ol> : <p className="mt-2 text-sm text-muted">No one is waiting.</p>}</section></article></main>;
}
