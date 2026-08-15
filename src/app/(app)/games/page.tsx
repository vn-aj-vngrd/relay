import Link from "next/link";
import { CalendarPlus, ChevronRight } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { formatSessionDate, formatSessionTime } from "@/features/sessions/format";
import { getHomeSessions } from "@/features/sessions/queries";

export default async function GamesPage() {
  const user = await requireUser();
  const data = await getHomeSessions(user.id);
  return <div><div className="flex items-end justify-between gap-4"><div><h1 className="text-[28px] font-bold tracking-[-0.035em] sm:text-4xl">Games</h1><p className="mt-2 text-muted">Plans, play, and the nights you kept.</p></div><span className="hidden sm:block"><ButtonLink href="/games/new"><CalendarPlus size={17} />Create game</ButtonLink></span></div>
    <section className="mt-10"><h2 className="text-lg font-bold">Upcoming</h2>{data.upcoming.length ? <div className="mt-3 divide-y divide-line border-y border-line">{data.upcoming.map(({ session, playerCount }) => <Link href={`/games/${session.id}`} key={session.id} className="group flex min-h-20 items-center gap-4 py-4"><time className="score w-20 text-sm font-bold text-primary">{formatSessionDate(session.startsAt)}</time><div className="min-w-0 flex-1"><h3 className="font-semibold">{session.title}</h3><p className="mt-1 truncate text-sm text-muted">{formatSessionTime(session.startsAt, session.endsAt)} · {session.venueName}</p></div><span className="score hidden text-sm sm:block">{playerCount} / {session.capacity}</span><ChevronRight size={19} className="text-muted" /></Link>)}</div> : <div className="mt-4 border-y border-line py-8"><p className="font-semibold">Nothing scheduled</p><p className="mt-1 text-sm text-muted">Create a game and send the link to your crew.</p><ButtonLink href="/games/new" className="mt-5">Create game</ButtonLink></div>}</section>
    <section className="mt-12"><h2 className="text-lg font-bold">Past games</h2>{data.recent.length ? <div className="mt-3 divide-y divide-line border-y border-line">{data.recent.map(({ session, playerCount }) => <Link href={`/s/${session.slug}`} key={session.id} className="flex min-h-20 items-center gap-4 py-4"><time className="score w-20 text-sm font-bold text-muted">{formatSessionDate(session.startsAt)}</time><div className="flex-1"><h3 className="font-semibold">{session.title}</h3><p className="mt-1 text-sm text-muted">{playerCount} players · {session.venueName}</p></div><ChevronRight size={19} className="text-muted" /></Link>)}</div> : <p className="mt-3 border-y border-line py-7 text-sm text-muted">Completed games will become memories here.</p>}</section>
  </div>;
}
