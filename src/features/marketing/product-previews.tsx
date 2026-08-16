import { CalendarBlank, ChatCircleDots, Check, CurrencyCircleDollar, House, UsersThree } from "@phosphor-icons/react/dist/ssr";
import Image from "next/image";

const players = [
  { initials: "VJ", color: "bg-[#ddd6fe] text-[#4c1d95]" },
  { initials: "AJ", color: "bg-[#bfdbfe] text-[#1e3a8a]" },
  { initials: "MR", color: "bg-[#fecdd3] text-[#881337]" },
  { initials: "JL", color: "bg-[#bbf7d0] text-[#14532d]" },
];

function Avatars({ compact = false }: { compact?: boolean }) {
  return <div className="flex -space-x-2" aria-label="Van, AJ, Mika, and John are going">{players.map((player) => <span key={player.initials} className={`grid shrink-0 place-items-center rounded-full border-2 border-white text-[9px] font-bold ${compact ? "h-7 w-7" : "h-8 w-8"} ${player.color}`}>{player.initials}</span>)}</div>;
}

function AppFrame({ children, label, className = "" }: { children: React.ReactNode; label: string; className?: string }) {
  return <div className={`overflow-hidden rounded-xl border border-[#d9d9d4] bg-[#f7f7f5] text-[#1b1b1f] shadow-[0_8px_8px_rgba(0,0,0,.08)] ${className}`} role="img" aria-label={label}>
    <div className="flex h-9 items-center gap-1.5 border-b border-[#e7e7e3] bg-white px-3"><span className="h-2 w-2 rounded-full bg-[#d8d8d4]" /><span className="h-2 w-2 rounded-full bg-[#d8d8d4]" /><span className="h-2 w-2 rounded-full bg-[#d8d8d4]" /><span className="ml-3 text-[10px] font-medium text-[#64646a]">Relay</span></div>
    {children}
  </div>;
}

export function HeroProductPreview() {
  return <AppFrame label="Relay session overview showing the plan, roster, payment, and active courts" className="marketing-hero-frame">
    <div className="grid min-h-[420px] grid-cols-[150px_1fr] max-md:grid-cols-1">
      <aside className="border-r border-[#e5e5e1] bg-[#f0f0ed] p-3 max-md:hidden">
        <div className="mb-5 flex items-center gap-2 px-2 text-xs font-bold"><span className="grid h-5 w-5 place-items-center rounded-full bg-[#18181b] text-[8px] text-white">R</span>Relay</div>
        <div className="space-y-1 text-[11px] text-[#64646a]"><div className="flex items-center gap-2 rounded-md bg-white px-2 py-2 font-semibold text-[#26262a]"><House size={13} weight="fill" />Home</div><div className="flex items-center gap-2 px-2 py-2"><CalendarBlank size={13} />Games</div><div className="flex items-center gap-2 px-2 py-2"><UsersThree size={13} />Groups</div></div>
      </aside>
      <div className="p-5 sm:p-7">
        <div className="mb-5 flex items-end justify-between gap-3"><div><p className="text-[11px] text-[#64646a]">Saturday, August 22 · 7:00 PM</p><h3 className="mt-1 text-xl font-semibold tracking-[-0.025em] sm:text-2xl">Saturday Night Pickle</h3></div><span className="rounded-full bg-[#ebf8d6] px-2.5 py-1 text-[10px] font-bold text-[#385b11]">Court confirmed</span></div>
        <div className="overflow-hidden rounded-[10px] bg-[#101827] text-white">
          <div className="grid sm:grid-cols-[1fr_145px]"><div className="p-5"><p className="text-[10px] font-semibold text-white/55">CENTRAL PICKLE · COURTS 2 & 3</p><p className="mt-6 text-sm text-white/70">8 of 10 players · ₱300 per player</p><div className="mt-4 flex items-center justify-between"><Avatars /><span className="text-[10px] text-[#c6e44b]">2 spots left</span></div></div><div className="flex min-h-24 flex-col justify-end bg-[#6657d9] p-4"><span className="text-[10px] text-white">Everything is ready</span><span className="mt-1 text-sm font-semibold">View game →</span></div></div>
        </div>
        <div className="mt-4 grid grid-cols-3 divide-x divide-[#e5e5e1] border-y border-[#e5e5e1] py-3 text-[10px]"><div className="pr-3"><span className="text-[#64646a]">Players</span><strong className="mt-1 block text-xs">8 going</strong></div><div className="px-3"><span className="text-[#64646a]">Payment</span><strong className="mt-1 block text-xs">5 confirmed</strong></div><div className="pl-3"><span className="text-[#64646a]">Up next</span><strong className="mt-1 block text-xs">Mika + John</strong></div></div>
        <div className="mt-4 flex items-center justify-between gap-3 rounded-lg border border-[#e5e5e1] bg-white px-4 py-3"><div><p className="text-[10px] text-[#64646a]">Court 1 · Live</p><p className="mt-1 text-xs font-semibold">Van + AJ <span className="font-normal text-[#64646a]">vs</span> John + Mika</p></div><span className="font-mono text-2xl font-bold tracking-[-0.08em]">8–6</span></div>
      </div>
    </div>
  </AppFrame>;
}

export function InvitePreview() {
  const rows = [["VJ", "Van", "Host"], ["AJ", "AJ Santos", "Going"], ["MR", "Mika Reyes", "Going"], ["JL", "John Lim", "Maybe"]];
  return <AppFrame label="A public Relay invite with session details and player responses">
    <div className="p-5 sm:p-6"><div className="flex items-start justify-between gap-4"><div><p className="text-[10px] text-[#64646a]">SAT · AUG 22 · 7:00 PM</p><h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Saturday Night Pickle</h3><p className="mt-1 text-xs text-[#64646a]">Central Pickle · Mandaluyong</p></div><span className="rounded-full bg-[#ebf8d6] px-2 py-1 text-[9px] font-bold text-[#385b11]">2 spots left</span></div><div className="mt-5 grid grid-cols-3 gap-2" aria-hidden><span className="rounded-md bg-[#6255d8] px-2 py-2.5 text-center text-[10px] font-semibold text-white">Join game</span><span className="rounded-md border border-[#deded9] bg-white px-2 py-2.5 text-center text-[10px] font-semibold">Maybe</span><span className="rounded-md border border-[#deded9] bg-white px-2 py-2.5 text-center text-[10px] font-semibold">Share</span></div><div className="mt-5 divide-y divide-[#e5e5e1] border-y border-[#e5e5e1]">{rows.map(([initials, name, status]) => <div key={name} className="flex items-center gap-3 py-2.5"><span className="grid h-7 w-7 place-items-center rounded-full bg-[#e7e7e4] text-[9px] font-bold">{initials}</span><span className="flex-1 text-xs font-medium">{name}</span><span className="text-[10px] text-[#64646a]">{status}</span></div>)}</div></div>
  </AppFrame>;
}

export function LivePreview() {
  return <AppFrame label="Relay live mode showing two courts, scores, and the player queue">
    <div className="bg-[#0f1725] p-4 text-white sm:p-6"><div className="mb-4 flex items-center justify-between"><div><p className="text-[9px] font-semibold text-[#c6e44b]">LIVE MODE</p><h3 className="mt-1 text-lg font-semibold">2 courts in play</h3></div><span className="h-2 w-2 rounded-full bg-[#ff6d5a]" /></div><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-white/10 bg-white/[.04] p-4"><p className="text-[9px] text-white/50">COURT 1</p><div className="mt-3 flex items-end justify-between gap-3"><div className="text-xs leading-6"><strong>Van + AJ</strong><br/><span className="text-white/55">John + Mika</span></div><div className="font-mono text-4xl font-bold tracking-[-0.1em]">8<span className="text-white/30">–</span>6</div></div></div><div className="rounded-lg border border-white/10 bg-white/[.04] p-4"><p className="text-[9px] text-white/50">COURT 2</p><div className="mt-3 flex items-end justify-between gap-3"><div className="text-xs leading-6"><strong>Chris + Josh</strong><br/><span className="text-white/55">Mark + Kyle</span></div><div className="font-mono text-4xl font-bold tracking-[-0.1em]">10<span className="text-white/30">–</span>10</div></div></div></div><div className="mt-3 flex items-center gap-3 rounded-lg bg-white/[.06] px-4 py-3"><span className="text-[9px] font-semibold text-[#c6e44b]">UP NEXT</span><div className="flex-1 text-xs">Sarah · James · Carlo · Bea</div></div></div>
  </AppFrame>;
}

export function PaymentPreview() {
  const payments = [["AJ Santos", "Paid"], ["Mika Reyes", "Sent"], ["John Lim", "Unpaid"], ["Chris Tan", "Paid"]];
  return <AppFrame label="Relay payment split showing the amount per player and payment status">
    <div className="p-5 sm:p-6"><div className="flex items-end justify-between border-b border-[#e5e5e1] pb-5"><div><p className="text-[10px] text-[#64646a]">COURT EXPENSE</p><p className="mt-2 text-sm font-semibold">₱2,400 total</p></div><div className="text-right"><strong className="font-mono text-3xl tracking-[-0.08em]">₱300</strong><p className="text-[10px] text-[#64646a]">per player</p></div></div><div className="divide-y divide-[#e5e5e1]">{payments.map(([name, status]) => <div key={name} className="flex items-center gap-3 py-3"><CurrencyCircleDollar size={15} className="text-[#64646a]"/><span className="flex-1 text-xs font-medium">{name}</span><span className={`inline-flex items-center gap-1 text-[10px] font-semibold ${status === "Paid" ? "text-[#287148]" : status === "Sent" ? "text-[#6657d9]" : "text-[#64646a]"}`}>{status === "Paid" ? <Check size={11} weight="bold"/> : null}{status}</span></div>)}</div></div>
  </AppFrame>;
}

export function MemoryPreview() {
  return <AppFrame label="A completed Relay session memory with results, photos, and reactions">
    <div className="grid sm:grid-cols-[1.05fr_.95fr]"><div className="relative min-h-56 overflow-hidden"><Image src="/images/pickleball-friends.jpg" alt="Four friends playing doubles pickleball on an outdoor court" fill loading="eager" sizes="(min-width: 640px) 33vw, 100vw" className="object-cover" /></div><div className="p-5 sm:p-6"><p className="text-[10px] text-[#64646a]">SATURDAY · COMPLETED</p><h3 className="mt-2 text-xl font-semibold tracking-[-0.03em]">Saturday Night Pickle</h3><p className="mt-1 text-xs text-[#64646a]">Central Pickle · 3 hours</p><div className="mt-5 flex items-center justify-between border-y border-[#e5e5e1] py-4"><Avatars compact/><div className="text-right"><strong className="font-mono text-lg">12</strong><p className="text-[9px] text-[#64646a]">matches</p></div></div><div className="mt-4 flex items-center justify-between"><span className="inline-flex items-center gap-1.5 text-[10px] text-[#64646a]"><ChatCircleDots size={14}/>8 comments</span><span className="text-[10px] font-semibold text-[#6657d9]">Play again →</span></div></div></div>
  </AppFrame>;
}
