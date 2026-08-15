import Link from "next/link";
import { ArrowRight, CalendarPlus, ChevronRight, MapPin, Users } from "lucide-react";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";
import { formatSessionDate, formatSessionTime, peso } from "@/features/sessions/format";
import { getHomeSessions } from "@/features/sessions/queries";

const sessionFlow = [
  ["01", "Invite", "Share a public link. Friends can join by name."],
  ["02", "Play", "Run the paddle stack, court teams, and points."],
  ["03", "Remember", "Keep results and photos, then play again."],
] as const;

export default async function HomePage() {
  const user = await requireUser();
  const [profile, data] = await Promise.all([ensureProfile(user), getHomeSessions(user.id)]);
  const next = data.upcoming[0];

  return <div className="space-y-12 sm:space-y-16">
    <section className="flex items-end justify-between gap-4">
      <div><p className="mb-1 text-sm text-muted">Good to see you, {profile.name.split(" ")[0]}</p><h1 className="app-title">{next ? "Your next game is set." : "Ready for your next game?"}</h1></div>
      <span className="hidden sm:block"><ButtonLink href="/games/new"><CalendarPlus size={18} />Create game</ButtonLink></span>
    </section>

    {next ? <section aria-labelledby="next-game-heading">
      <h2 id="next-game-heading" className="mb-3 text-sm font-semibold text-muted">Next game</h2>
      <article className="overflow-hidden rounded-2xl bg-court text-white ring-1 ring-black/5">
        <div className="grid md:grid-cols-[1fr_260px]">
          <div className="p-5 sm:p-7">
            <div className="mb-7 flex items-center justify-between"><span className="sport-label text-white/65">{formatSessionDate(next.session.startsAt)}</span><span className="inline-flex items-center gap-2 text-sm font-[650] text-court-line"><span className={`h-2 w-2 rounded-full ${next.session.bookedAt ? "bg-signal" : "bg-white/35"}`} />{next.session.bookedAt ? "Court confirmed" : "Booking pending"}</span></div>
            <h3 className="max-w-xl text-[28px] font-[720] tracking-[-0.025em] sm:text-4xl">{next.session.title}</h3>
            <p className="mt-2 text-base text-white/70">{next.session.venueName} · {formatSessionTime(next.session.startsAt, next.session.endsAt)}</p>
            <div className="court-rule mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-5"><span className="inline-flex items-center gap-2 text-sm text-white/75"><Users size={16} />{next.playerCount} / {next.session.capacity} players</span>{next.session.estimatedCostCents ? <span className="score text-sm font-semibold">{peso(next.session.estimatedCostCents)} estimated</span> : null}</div>
          </div>
          <Link href={`/games/${next.session.id}`} prefetch={false} className="pressable group flex min-h-20 items-center justify-between bg-primary px-5 py-4 font-semibold hover:bg-primary-hover md:flex-col md:items-start md:justify-end md:p-6"><span><span className="block text-sm text-white/75">Everything in one place</span><span className="mt-1 block text-lg">View game</span></span><ArrowRight className="transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </article>
    </section> : <section className="border-y border-line lg:grid lg:grid-cols-[.9fr_1.1fr]" aria-labelledby="first-game-heading">
      <div className="py-8 lg:border-r lg:border-line lg:py-10 lg:pr-12">
        <p className="sport-label text-primary">One session, start to finish</p>
        <h2 id="first-game-heading" className="mt-4 max-w-md text-[1.75rem] font-[720] leading-tight tracking-[-0.03em] sm:text-3xl">Set the plan once.<br />Keep everyone moving.</h2>
        <p className="mt-4 max-w-md leading-7 text-muted">Relay gives your crew one clear home before, during, and after the game.</p>
        <ButtonLink href="/games/new" className="mt-7">Create your first game <ArrowRight size={17} /></ButtonLink>
      </div>
      <ol className="divide-y divide-line py-2 lg:py-5 lg:pl-12">{sessionFlow.map(([number, title, detail]) => <li key={number} className="grid grid-cols-[36px_88px_1fr] gap-3 py-5"><span className="score text-xs font-semibold text-primary">{number}</span><span className="font-[680]">{title}</span><span className="text-sm leading-5 text-muted">{detail}</span></li>)}</ol>
    </section>}

    {data.upcoming.length > 1 ? <section aria-labelledby="upcoming-heading"><div className="mb-3 flex items-center justify-between"><h2 id="upcoming-heading" className="text-lg font-bold">Upcoming games</h2><Link href="/games" className="text-sm font-semibold text-primary">View all</Link></div><div className="divide-y divide-line border-y border-line">{data.upcoming.slice(1, 4).map(({ session, playerCount }) => <Link href={`/games/${session.id}`} prefetch={false} key={session.id} className="pressable group flex items-center gap-4 py-4 hover:bg-surface-strong sm:px-2"><time className="score grid h-14 w-14 shrink-0 place-items-center rounded-[10px] bg-surface-strong text-center text-xs font-bold">{formatSessionDate(session.startsAt)}</time><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{session.title}</h3><p className="mt-1 truncate text-sm text-muted">{formatSessionTime(session.startsAt, session.endsAt)} · {session.venueName}</p></div><span className="score hidden text-sm sm:block">{playerCount} / {session.capacity}</span><ChevronRight className="text-muted" size={19} /></Link>)}</div></section> : null}

    {data.recent.length ? <section aria-labelledby="recent-heading"><h2 id="recent-heading" className="text-lg font-bold">Recent games</h2><div className="mt-3 divide-y divide-line border-y border-line">{data.recent.slice(0, 4).map(({ session, playerCount }) => <Link href={`/s/${session.slug}`} prefetch={false} key={session.id} className="pressable flex min-h-20 items-center gap-4 py-4 hover:bg-surface-strong sm:px-2"><MapPin className="text-muted" size={19} /><div className="flex-1"><h3 className="font-semibold">{session.title}</h3><p className="mt-1 text-sm text-muted">{formatSessionDate(session.startsAt)} · {session.venueName} · {playerCount} players</p></div><ChevronRight className="text-muted" size={19} /></Link>)}</div></section> : null}
  </div>;
}
