import Image from "next/image";
import Link from "next/link";
import { ArrowRight, CalendarPlus, ChevronRight, Clock3, MapPin, Users } from "lucide-react";
import { AvatarStack } from "@/components/shared/avatar-stack";
import { ButtonLink } from "@/components/ui/button";
import { recent, session, upcoming } from "@/features/sessions/demo-data";

export default function HomePage() {
  return <div className="space-y-12">
    <section className="flex items-end justify-between gap-4">
      <div><p className="mb-1 text-sm text-muted">Good afternoon, Van</p><h1 className="text-[28px] font-bold tracking-[-0.035em] sm:text-4xl">Your next game is set.</h1></div>
      <span className="hidden sm:block"><ButtonLink href="/games/new"><CalendarPlus size={18} />Create game</ButtonLink></span>
    </section>

    <section aria-labelledby="next-game-heading">
      <h2 id="next-game-heading" className="mb-3 text-sm font-semibold text-muted">Next game</h2>
      <article className="overflow-hidden rounded-2xl bg-court text-white">
        <div className="grid md:grid-cols-[1fr_260px]">
          <div className="p-5 sm:p-7">
            <div className="mb-7 flex items-center justify-between"><span className="score text-sm font-semibold text-white/70">SAT · AUG 22</span><span className="inline-flex items-center gap-1.5 text-sm font-medium text-[#8dd6c1]"><span className="h-2 w-2 rounded-full bg-[#8dd6c1]" />Court confirmed</span></div>
            <h3 className="max-w-xl text-[28px] font-bold tracking-[-0.035em] sm:text-4xl">{session.title}</h3>
            <p className="mt-2 text-base text-white/70">{session.venue} · {session.time}</p>
            <div className="mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t border-white/15 pt-5">
              <AvatarStack names={session.players.slice(0, 4)} total={session.players.length} />
              <span className="inline-flex items-center gap-2 text-sm text-white/75"><Users size={16} />{session.players.length} / {session.capacity} players</span>
              <span className="score text-sm font-semibold">₱{session.price} due</span>
            </div>
          </div>
          <Link href={`/games/${session.id}`} className="pressable group flex min-h-20 items-center justify-between bg-primary px-5 py-4 font-semibold hover:bg-primary-hover md:flex-col md:items-start md:justify-end md:p-6">
            <span><span className="block text-sm text-white/75">Ready when you are</span><span className="mt-1 block text-lg">View game</span></span><ArrowRight className="transition-transform group-hover:translate-x-1" aria-hidden />
          </Link>
        </div>
      </article>
    </section>

    <div className="grid gap-12 lg:grid-cols-[1.4fr_.8fr]">
      <section aria-labelledby="upcoming-heading">
        <div className="mb-3 flex items-center justify-between"><h2 id="upcoming-heading" className="text-lg font-bold">Upcoming games</h2><Link href="/games" className="text-sm font-semibold text-primary hover:underline">View all</Link></div>
        <div className="divide-y divide-line border-y border-line">
          {upcoming.map((game) => <Link href="/games" key={game.title} className="pressable group flex items-center gap-4 py-4 hover:bg-surface sm:px-2">
            <time className="score grid h-14 w-14 shrink-0 place-items-center rounded-[10px] bg-surface text-center text-xs font-bold leading-4">{game.date.split(", ").map((part) => <span key={part}>{part}</span>)}</time>
            <div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{game.title}</h3><p className="mt-1 truncate text-sm text-muted">{game.time} · {game.venue}</p></div>
            <div className="hidden text-right sm:block"><p className="score text-sm font-semibold">{game.count}</p><p className="mt-1 text-xs text-muted">{game.status}</p></div><ChevronRight className="text-muted group-hover:text-ink" size={19} />
          </Link>)}
        </div>
      </section>

      <section aria-labelledby="actions-heading">
        <h2 id="actions-heading" className="mb-3 text-lg font-bold">Needs your attention</h2>
        <div className="rounded-xl border border-line p-4">
          <div className="flex gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-[oklch(.96_.04_75)] text-[oklch(.45_.12_65)]"><Clock3 size={19} /></span><div><h3 className="font-semibold">Payment due Saturday</h3><p className="mt-1 text-sm leading-5 text-muted">Send ₱300 to Van before the game.</p><Link href={`/games/${session.id}/payments`} className="mt-3 inline-flex min-h-11 items-center text-sm font-semibold text-primary">View payment details <ChevronRight size={17} /></Link></div></div>
        </div>
      </section>
    </div>

    <section aria-labelledby="recent-heading">
      <div className="mb-4 flex items-end justify-between"><div><h2 id="recent-heading" className="text-lg font-bold">Recent games</h2><p className="mt-1 text-sm text-muted">Good nights worth keeping.</p></div></div>
      <div className="grid gap-5 sm:grid-cols-2">
        {recent.map((game) => <Link href={`/s/${session.slug}`} key={game.title} className="group grid grid-cols-[112px_1fr] overflow-hidden rounded-xl border border-line sm:grid-cols-[160px_1fr]">
          <Image src={game.image} alt="Players on a pickleball court" width={320} height={220} className="h-full min-h-32 w-full object-cover transition-transform duration-300 group-hover:scale-[1.025]" />
          <div className="flex min-w-0 flex-col justify-between p-4"><div><p className="score text-xs font-semibold text-muted">{game.date}</p><h3 className="mt-1 truncate font-semibold">{game.title}</h3><p className="mt-1 flex items-center gap-1.5 truncate text-sm text-muted"><MapPin size={14} />{game.venue}</p></div><p className="mt-4 text-sm text-muted">{game.players} players · {game.matches} matches</p></div>
        </Link>)}
      </div>
    </section>
  </div>;
}
