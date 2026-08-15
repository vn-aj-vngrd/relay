import { CalendarDays, ChevronRight, Clock3, MapPin, Play } from "lucide-react";
import { notFound } from "next/navigation";
import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { SessionNav } from "@/components/shared/session-nav";
import { Status } from "@/components/shared/status";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { formatSessionDateLong, formatSessionTime, peso } from "@/features/sessions/format";
import { getSessionForUser } from "@/features/sessions/queries";
import { ShareButton } from "@/features/sessions/share-button";

export default async function GameOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const user = await requireUser();
  const data = await getSessionForUser((await params).id, user.id);
  if (!data) notFound();
  const { session, membership, roster } = data;
  const going = roster.filter(({ player }) => player.rsvp === "going");
  const names = going.map(({ player, profile }) => profile?.name ?? player.guestName ?? "Guest");
  const isHost = session.hostId === user.id || membership?.role === "cohost";
  return <div><div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><p className="sport-label mb-2 text-primary">{formatSessionDateLong(session.startsAt).toUpperCase()}</p><h1 className="app-title">{session.title}</h1><p className="mt-2 text-muted">{isHost ? "Hosted by you" : "You’re going"}</p></div><ShareButton url={`/s/${session.slug}`} title={session.title} /></div><SessionNav id={session.id} />
    <div className="grid gap-10 pt-7 lg:grid-cols-[1fr_360px]"><div className="space-y-9"><section aria-labelledby="plan-title"><h2 id="plan-title" className="mb-4 text-lg font-bold">The plan</h2><div className="divide-y divide-line border-y border-line"><div className="flex gap-3 py-4"><CalendarDays className="text-primary" size={20} /><div><p className="font-semibold">{formatSessionDateLong(session.startsAt)}</p><p className="mt-1 text-sm text-muted">{formatSessionTime(session.startsAt, session.endsAt)}</p></div></div><div className="flex gap-3 py-4"><MapPin className="text-primary" size={20} /><div className="flex-1"><p className="font-semibold">{session.venueName}</p><p className="mt-1 text-sm text-muted">{session.courtNumbers?.length ? `Courts ${session.courtNumbers.join(" and ")}` : `${session.courtCount} ${session.courtCount === 1 ? "court" : "courts"}`}</p></div><ChevronRight size={19} className="text-muted" /></div><div className="flex gap-3 py-4"><Clock3 className="text-primary" size={20} /><div><p className="font-semibold">Arrive 15 minutes early</p><p className="mt-1 text-sm text-muted">Warm up and sort the first rotation</p></div></div></div></section>
      <section aria-labelledby="booking-title"><h2 id="booking-title" className="mb-4 text-lg font-bold">Booking</h2><div className={`flex items-start justify-between gap-4 rounded-xl p-4 ${session.bookedAt ? "bg-primary-soft" : "bg-surface"}`}><div><Status kind={session.bookedAt ? "confirmed" : "pending"} /><p className="mt-2 text-sm text-muted">{session.bookingReference ? `Reference ${session.bookingReference}` : session.bookedAt ? "Marked booked by the host" : "The host hasn’t confirmed the court yet"}</p></div>{session.bookingTotalCents ? <span className="score text-sm font-semibold">{peso(session.bookingTotalCents)}</span> : null}</div></section>
      {session.notes ? <section><h2 className="text-lg font-bold">Note for players</h2><p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">{session.notes}</p></section> : null}</div>
      <aside className="space-y-7"><section><div className="mb-4 flex items-end justify-between"><div><h2 className="text-lg font-bold">Players</h2><p className="mt-1 text-sm text-muted">{going.length} of {session.capacity} going</p></div><AvatarStack names={names.slice(0, 3)} total={going.length} /></div><ul className="divide-y divide-line border-y border-line">{going.slice(0, 5).map(({ player, profile }, index) => { const name = profile?.name ?? player.guestName ?? "Guest"; return <li className="flex min-h-14 items-center gap-3 py-2" key={player.id}><Avatar name={name} index={index} size="sm" /><span className="flex-1 text-sm font-medium">{name}</span><span className="text-xs text-muted">{player.role === "host" ? "Host" : "Going"}</span></li>; })}</ul><ButtonLink href={`/games/${session.id}/players`} variant="quiet" className="mt-2 w-full">View all players <ChevronRight size={17} /></ButtonLink></section>
      {session.estimatedCostCents ? <section className="rounded-xl border border-line p-4"><Status kind="due" /><p className="score mt-2 text-2xl font-bold">{peso(session.estimatedCostCents)}</p><p className="mt-1 text-sm text-muted">Estimated share</p><ButtonLink href={`/games/${session.id}/payments`} variant="secondary" className="mt-4 w-full">Payment details</ButtonLink></section> : null}
      {isHost ? <ButtonLink href={`/games/${session.id}/live`} className="w-full"><Play fill="currentColor" size={17} />Start Live Mode</ButtonLink> : null}</aside></div></div>;
}
