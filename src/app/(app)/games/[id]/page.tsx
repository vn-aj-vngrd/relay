import { CalendarDays, ChevronRight, Clock3, MapPin, Play, Share2 } from "lucide-react";
import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { SessionNav } from "@/components/shared/session-nav";
import { Status } from "@/components/shared/status";
import { ButtonLink } from "@/components/ui/button";
import { session } from "@/features/sessions/demo-data";

export default function GameOverviewPage() {
  return <div>
    <div className="mb-5 flex flex-wrap items-start justify-between gap-4"><div><p className="score mb-2 text-sm font-semibold text-primary">SAT · AUG 22</p><h1 className="text-[28px] font-bold tracking-[-0.035em] sm:text-4xl">{session.title}</h1><p className="mt-2 text-muted">Hosted by you</p></div><button className="pressable inline-flex min-h-11 items-center gap-2 rounded-[10px] border border-line px-4 text-sm font-semibold hover:bg-surface"><Share2 size={17} />Share</button></div>
    <SessionNav id={session.id} />
    <div className="grid gap-10 pt-7 lg:grid-cols-[1fr_360px]">
      <div className="space-y-9">
        <section aria-labelledby="plan-title"><h2 id="plan-title" className="mb-4 text-lg font-bold">The plan</h2><div className="divide-y divide-line border-y border-line">
          <div className="flex gap-3 py-4"><CalendarDays className="text-primary" size={20} /><div><p className="font-semibold">{session.dateLong}</p><p className="mt-1 text-sm text-muted">{session.time}</p></div></div>
          <div className="flex gap-3 py-4"><MapPin className="text-primary" size={20} /><div className="flex-1"><p className="font-semibold">{session.venue}</p><p className="mt-1 text-sm text-muted">{session.address} · {session.courts}</p></div><ChevronRight size={19} className="text-muted" /></div>
          <div className="flex gap-3 py-4"><Clock3 className="text-primary" size={20} /><div><p className="font-semibold">Arrive by 6:45 PM</p><p className="mt-1 text-sm text-muted">Warm up and sort the first rotation</p></div></div>
        </div></section>
        <section aria-labelledby="booking-title"><div className="mb-4 flex items-center justify-between"><h2 id="booking-title" className="text-lg font-bold">Booking</h2><button className="min-h-11 text-sm font-semibold text-primary">Edit</button></div><div className="flex items-start justify-between gap-4 rounded-xl bg-primary-soft p-4"><div><Status kind="confirmed" /><p className="mt-2 text-sm text-muted">Courts 2 and 3 · Ref. CP-0822-19</p></div><span className="score text-sm font-semibold">₱2,400</span></div></section>
        <section aria-labelledby="note-title"><h2 id="note-title" className="text-lg font-bold">Note for players</h2><p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">{session.notes}</p></section>
      </div>
      <aside className="space-y-7">
        <section aria-labelledby="roster-title"><div className="mb-4 flex items-end justify-between"><div><h2 id="roster-title" className="text-lg font-bold">Players</h2><p className="mt-1 text-sm text-muted">{session.players.length} of {session.capacity} going</p></div><AvatarStack names={session.players.slice(0, 3)} total={session.players.length} /></div><ul className="divide-y divide-line border-y border-line">{session.players.slice(0, 5).map((player, index) => <li className="flex min-h-14 items-center gap-3 py-2" key={player}><Avatar name={player} index={index} size="sm" /><span className="flex-1 text-sm font-medium">{player}</span><span className="text-xs text-muted">{index === 0 ? "Host" : "Going"}</span></li>)}</ul><ButtonLink href={`/games/${session.id}/players`} variant="quiet" className="mt-2 w-full">View all players <ChevronRight size={17} /></ButtonLink></section>
        <section className="rounded-xl border border-line p-4"><Status kind="due" /><div className="mt-2 flex items-end justify-between"><div><p className="score text-2xl font-bold">₱300</p><p className="mt-1 text-sm text-muted">Your share of the court</p></div><ButtonLink href={`/games/${session.id}/payments`} variant="secondary">View</ButtonLink></div></section>
        <ButtonLink href={`/games/${session.id}/live`} className="w-full"><Play fill="currentColor" size={17} />Start Live Mode</ButtonLink>
      </aside>
    </div>
  </div>;
}
