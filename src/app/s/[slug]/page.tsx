import type { Metadata } from "next";
import Link from "next/link";
import { CalendarDays, CheckCircle2, Clock3, ExternalLink, MapPin, Users } from "lucide-react";
import { Avatar, AvatarStack } from "@/components/shared/avatar-stack";
import { Brand } from "@/components/shared/brand";
import { RsvpControl } from "@/features/sessions/rsvp-control";
import { session } from "@/features/sessions/demo-data";

export async function generateMetadata(): Promise<Metadata> {
  return { title: session.title, description: `${session.dateLong}, ${session.time} at ${session.venue}. ${session.players.length} of ${session.capacity} players.`, openGraph: { title: session.title, description: `${session.dateLong} · ${session.venue} · ${session.capacity - session.players.length} spots left`, type: "website" } };
}

export default function PublicSessionPage() {
  const spots = session.capacity - session.players.length;
  return <main className="min-h-screen bg-surface">
    <header className="border-b border-line bg-canvas"><div className="mx-auto flex h-16 max-w-[1040px] items-center justify-between px-4 sm:px-6"><Brand /><Link href="/login" className="min-h-11 px-2 py-3 text-sm font-semibold text-muted hover:text-ink">Sign in</Link></div></header>
    <div className="mx-auto grid max-w-[1040px] gap-6 px-0 pb-12 sm:px-6 sm:pt-8 lg:grid-cols-[1fr_350px]">
      <article className="bg-canvas sm:rounded-2xl sm:border sm:border-line">
        <div className="relative overflow-hidden bg-court px-5 pb-8 pt-7 text-white sm:rounded-t-2xl sm:px-8 sm:pb-10">
          <div className="absolute inset-y-0 right-[18%] w-px bg-white/12" /><div className="absolute right-0 top-[68%] h-px w-[36%] bg-white/12" />
          <p className="score text-sm font-bold text-[#8dd6c1]">SATURDAY · AUGUST 22</p><h1 className="relative mt-4 max-w-xl text-4xl font-bold tracking-[-0.04em] sm:text-5xl">{session.title}</h1><p className="relative mt-3 text-white/70">Hosted by {session.host}</p>
        </div>
        <div className="border-b border-line px-5 py-5 lg:hidden">
          <div className="mb-4 flex items-center justify-between"><div><strong className="score text-2xl text-primary">{spots} spots left</strong><p className="mt-1 text-sm text-muted">Join with no account needed</p></div></div>
          <RsvpControl />
        </div>
        <div className="px-5 py-6 sm:px-8 sm:py-8">
          <section aria-label="Session plan" className="grid gap-5 border-b border-line pb-7 sm:grid-cols-2">
            <div className="flex gap-3"><CalendarDays className="mt-0.5 text-primary" size={21} /><div><p className="font-semibold">{session.dateLong}</p><p className="mt-1 text-sm text-muted">{session.time}</p></div></div>
            <div className="flex gap-3"><MapPin className="mt-0.5 text-primary" size={21} /><div><p className="font-semibold">{session.venue}</p><p className="mt-1 text-sm text-muted">{session.address}</p><a href="https://maps.google.com" target="_blank" rel="noreferrer" className="mt-2 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-primary">Get directions <ExternalLink size={14} /></a></div></div>
            <div className="flex gap-3"><Clock3 className="mt-0.5 text-primary" size={21} /><div><p className="font-semibold">3 hours</p><p className="mt-1 text-sm text-muted">{session.courts}</p></div></div>
            <div className="flex gap-3"><CheckCircle2 className="mt-0.5 text-success" size={21} /><div><p className="font-semibold">Court confirmed</p><p className="mt-1 text-sm text-muted">₱{session.price} estimated per player</p></div></div>
          </section>
          <section aria-labelledby="players-title" className="border-b border-line py-7">
            <div className="flex items-start justify-between gap-3"><div><h2 id="players-title" className="text-lg font-bold">Who&apos;s playing</h2><p className="mt-1 text-sm text-muted">{session.players.length} going · <strong className="text-primary">{spots} spots left</strong></p></div><AvatarStack names={session.players.slice(0, 3)} total={session.players.length} /></div>
            <ul className="mt-6 grid grid-cols-2 gap-x-4 gap-y-4 sm:grid-cols-3">{session.players.map((player, index) => <li key={player} className="flex min-w-0 items-center gap-2.5"><Avatar name={player} index={index} size="sm" /><span className="truncate text-sm font-medium">{player}{index === 0 ? <span className="block text-xs font-normal text-muted">Host</span> : null}</span></li>)}</ul>
          </section>
          <section aria-labelledby="notes-title" className="pt-7"><h2 id="notes-title" className="text-lg font-bold">A note from Van</h2><p className="mt-3 max-w-2xl text-pretty leading-7 text-muted">{session.notes}</p></section>
        </div>
      </article>
      <aside className="hidden self-start bg-canvas p-5 sm:rounded-2xl sm:border sm:border-line lg:sticky lg:top-6 lg:block">
        <div className="mb-5 flex items-center gap-3"><span className="score text-4xl font-bold text-primary">{spots}</span><div><p className="font-semibold">spots left</p><p className="text-sm text-muted">Join with no account needed</p></div></div><RsvpControl /><div className="mt-5 border-t border-line pt-5"><p className="flex items-center gap-2 text-sm text-muted"><Users size={16} />Your name is only shared with this group.</p></div>
      </aside>
    </div>
  </main>;
}
