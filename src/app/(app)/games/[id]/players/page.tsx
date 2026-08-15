import { notFound } from "next/navigation";
import { Avatar } from "@/components/shared/avatar-stack";
import { SessionNav } from "@/components/shared/session-nav";
import { ShareButton } from "@/features/sessions/share-button";
import { requireUser } from "@/features/auth/session";
import { getSessionForUser } from "@/features/sessions/queries";

export default async function PlayersPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getSessionForUser((await params).id, user.id);
  if (!data) notFound();
  const going = data.roster.filter(({ player }) => player.rsvp === "going");
  const waitlist = data.roster.filter(({ player }) => player.rsvp === "waitlisted");
  const isHost = data.session.hostId === user.id || data.membership?.role === "cohost";
  return <div><div className="mb-5 flex items-end justify-between"><div><p className="text-sm font-semibold text-primary">{data.session.title}</p><h1 className="mt-1 app-title">Players</h1></div>{isHost ? <ShareButton url={`/s/${data.session.slug}`} title={data.session.title} /> : null}</div><SessionNav id={data.session.id} active="Players" /><section className="mx-auto max-w-2xl pt-7"><div className="flex items-end justify-between"><div><h2 className="text-lg font-bold">Going</h2><p className="mt-1 text-sm text-muted">{going.length} of {data.session.capacity} spots filled</p></div><span className="score text-2xl font-bold text-primary">{Math.max(0, data.session.capacity - going.length)} left</span></div><ul className="mt-4 divide-y divide-line border-y border-line">{going.map(({ player, profile }, index) => { const name = profile?.name ?? player.guestName ?? "Guest"; return <li key={player.id} className="flex min-h-16 items-center gap-3 py-2"><Avatar name={name} index={index} size="sm" /><span className="flex-1 font-medium">{name}{player.role === "host" ? <span className="ml-2 text-xs font-normal text-muted">Host</span> : null}</span></li>; })}</ul><div className="mt-9"><h2 className="text-lg font-bold">Waitlist</h2>{waitlist.length ? <ol className="mt-3 divide-y divide-line border-y border-line">{waitlist.map(({ player, profile }, index) => <li key={player.id} className="flex min-h-14 items-center gap-3"><span className="score w-5 text-sm text-muted">{index + 1}</span><span className="font-medium">{profile?.name ?? player.guestName ?? "Guest"}</span></li>)}</ol> : <p className="mt-2 text-sm text-muted">No one is waiting. New players will be added here when the game is full.</p>}</div></section></div>;
}
