import Link from "next/link";
import { ArrowRight, CaretRight, CurrencyCircleDollar, MapPin, SquaresFour, Users, UsersThree } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";
import { formatSessionDate, formatSessionTime, peso } from "@/features/sessions/format";
import { getHomeSessions } from "@/features/sessions/queries";

export default async function HomePage() {
  const user = await requireUser();
  const [profile, data] = await Promise.all([ensureProfile(user), getHomeSessions(user.id)]);
  const next = data.upcoming[0];

  return <div className="space-y-12 sm:space-y-16">
    <section className="flex items-end justify-between gap-4">
      <div><p className="mb-1 text-sm text-muted">Good to see you, {profile.name.split(" ")[0]}</p><h1 className="app-title">{next ? "Your next game is set." : "Ready for your next game?"}</h1></div>
    </section>

    {next ? <section aria-labelledby="next-game-heading">
      <h2 id="next-game-heading" className="mb-3 text-sm font-semibold text-muted">Next game</h2>
      <article className="overflow-hidden rounded-xl bg-court text-white ring-1 ring-black/5">
        <div className="grid md:grid-cols-[1fr_260px]">
          <div className="p-5 sm:p-7">
            <div className="mb-7 flex items-center justify-between"><span className="sport-label text-white/65">{formatSessionDate(next.session.startsAt)}</span><span className="inline-flex items-center gap-2 text-sm font-[650] text-court-line"><span className={`h-2 w-2 rounded-full ${next.session.bookedAt ? "bg-signal" : "bg-white/35"}`} />{next.session.bookedAt ? "Court confirmed" : "Booking pending"}</span></div>
            <h3 className="max-w-xl text-[28px] font-[680] tracking-[-0.025em] sm:text-4xl">{next.session.title}</h3>
            <p className="mt-2 text-base text-white/70">{next.session.venueName} · {formatSessionTime(next.session.startsAt, next.session.endsAt)}</p>
            <div className="court-rule mt-7 flex flex-wrap items-center gap-x-5 gap-y-3 border-t pt-5"><span className="inline-flex items-center gap-2 text-sm text-white/75"><Users size={16} />{next.playerCount} / {next.session.capacity} players</span>{next.session.estimatedCostCents ? <span className="score text-sm font-semibold">{peso(next.session.estimatedCostCents)} estimated</span> : null}</div>
          </div>
          <Link href={`/games/${next.session.id}`} prefetch={false} className="pressable group flex min-h-20 items-center justify-between bg-primary px-5 py-4 font-semibold hover:bg-primary-hover md:flex-col md:items-start md:justify-end md:p-6"><span><span className="block text-sm text-white/75">Everything in one place</span><span className="mt-1 block text-lg">View game</span></span><ArrowRight className="transition-transform group-hover:translate-x-1" /></Link>
        </div>
      </article>
      <div className="mt-4 grid divide-y divide-line border-y border-line sm:grid-cols-3 sm:divide-x sm:divide-y-0"><Link href={`/games/${next.session.id}/players`} prefetch={false} className="pressable flex min-h-14 items-center gap-3 py-3 hover:bg-surface-strong sm:px-3"><UsersThree size={18} className="text-muted" /><span><span className="block text-sm font-medium">Players</span><span className="mt-0.5 block text-xs text-muted">{next.playerCount} of {next.session.capacity} going</span></span></Link><Link href={`/games/${next.session.id}/payments`} prefetch={false} className="pressable flex min-h-14 items-center gap-3 py-3 hover:bg-surface-strong sm:px-3"><CurrencyCircleDollar size={18} className="text-muted" /><span><span className="block text-sm font-medium">Payments</span><span className="mt-0.5 block text-xs text-muted">View the split</span></span></Link><Link href={`/games/${next.session.id}/live`} prefetch={false} className="pressable flex min-h-14 items-center gap-3 py-3 hover:bg-surface-strong sm:px-3"><SquaresFour size={18} className="text-muted" /><span><span className="block text-sm font-medium">Courts</span><span className="mt-0.5 block text-xs text-muted">Queue and scores</span></span></Link></div>
    </section> : <section className="border-y border-line lg:grid lg:grid-cols-[.9fr_1.1fr]" aria-labelledby="first-game-heading">
      <div className="py-8 lg:border-r lg:border-line lg:py-10 lg:pr-12">
        <h2 id="first-game-heading" className="max-w-md text-[1.75rem] font-[680] leading-tight tracking-[-0.03em] sm:text-3xl">One clear plan for the whole game.</h2>
        <p className="mt-4 max-w-md leading-7 text-muted">Create it once, send the link, and let friends see what they need without signing in.</p>
        <div className="mt-7 flex flex-wrap items-center gap-4"><ButtonLink href="/games/new">Create your first game <ArrowRight size={17} /></ButtonLink><Link href="/onboarding/tour?replay=1" className="inline-flex min-h-11 items-center text-sm font-semibold text-muted hover:text-ink">Replay the short tour</Link></div>
      </div>
      <div className="py-3 lg:py-5 lg:pl-12"><p className="mb-2 text-sm font-semibold text-muted">Everything the link carries</p><dl className="divide-y divide-line"><div className="grid grid-cols-[88px_1fr] gap-4 py-3.5"><dt className="text-sm text-muted">Plan</dt><dd className="text-sm font-medium">Time, venue, courts, and cost</dd></div><div className="grid grid-cols-[88px_1fr] gap-4 py-3.5"><dt className="text-sm text-muted">Roster</dt><dd className="text-sm font-medium">Going, maybe, and waitlist</dd></div><div className="grid grid-cols-[88px_1fr] gap-4 py-3.5"><dt className="text-sm text-muted">Courtside</dt><dd className="text-sm font-medium">Paddle stack, teams, and score</dd></div><div className="grid grid-cols-[88px_1fr] gap-4 py-3.5"><dt className="text-sm text-muted">After</dt><dd className="text-sm font-medium">Payment status, results, and photos</dd></div></dl></div>
    </section>}

    {data.upcoming.length > 1 ? <section aria-labelledby="upcoming-heading"><div className="mb-3 flex items-center justify-between"><h2 id="upcoming-heading" className="text-lg font-bold">Upcoming games</h2><Link href="/games" className="text-sm font-semibold text-primary">View all</Link></div><div className="divide-y divide-line border-y border-line">{data.upcoming.slice(1, 4).map(({ session, playerCount }) => <Link href={`/games/${session.id}`} prefetch={false} key={session.id} className="pressable group flex items-center gap-4 py-4 hover:bg-surface-strong sm:px-2"><time className="score grid h-14 w-14 shrink-0 place-items-center rounded-[10px] bg-surface-strong text-center text-xs font-bold">{formatSessionDate(session.startsAt)}</time><div className="min-w-0 flex-1"><h3 className="truncate font-semibold">{session.title}</h3><p className="mt-1 truncate text-sm text-muted">{formatSessionTime(session.startsAt, session.endsAt)} · {session.venueName}</p></div><span className="score hidden text-sm sm:block">{playerCount} / {session.capacity}</span><CaretRight className="text-muted" size={16} /></Link>)}</div></section> : null}

    {data.recent.length ? <section aria-labelledby="recent-heading"><h2 id="recent-heading" className="text-lg font-bold">Recent games</h2><div className="mt-3 divide-y divide-line border-y border-line">{data.recent.slice(0, 4).map(({ session, playerCount }) => <Link href={`/s/${session.slug}`} prefetch={false} key={session.id} className="pressable flex min-h-20 items-center gap-4 py-4 hover:bg-surface-strong sm:px-2"><MapPin className="text-muted" size={19} /><div className="flex-1"><h3 className="font-semibold">{session.title}</h3><p className="mt-1 text-sm text-muted">{formatSessionDate(session.startsAt)} · {session.venueName} · {playerCount} players</p></div><CaretRight className="text-muted" size={16} /></Link>)}</div></section> : null}
  </div>;
}
