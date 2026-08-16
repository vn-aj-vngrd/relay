"use client";

import { CalendarBlank, CurrencyCircleDollar, LinkSimple, TennisBall } from "@phosphor-icons/react";
import { useState } from "react";

const features = [
  { name: "Plan", detail: "Time, venue, roster, courts, and cost.", value: "Sat · 7:00 PM", meta: "Central Pickle · Courts 2 & 3", icon: CalendarBlank },
  { name: "Invite", detail: "One public link. Guests can join by name.", value: "8 of 10 going", meta: "Two spots left · link ready", icon: LinkSimple },
  { name: "Play", detail: "Paddle stack, teams, and live scoring.", value: "Court 1 · 8–6", meta: "Four players up next", icon: TennisBall },
  { name: "Settle", detail: "Split expenses and review payment proof.", value: "₱300 per player", meta: "6 paid · 2 awaiting review", icon: CurrencyCircleDollar },
] as const;

export function LoginShowcase() {
  const [active, setActive] = useState(2);
  const selected = features[active];

  return <div className="mt-4 sm:mt-6">
    <div className="login-court-stage" data-feature={selected.name.toLowerCase()}>
      <div className="login-court-plane" aria-hidden><span className="login-court-net" /><span className="login-court-center-a" /><span className="login-court-center-b" /><span className="login-paddle login-paddle-left" /><span className="login-paddle login-paddle-right" /><span className="login-ball" /></div>
      <div className="login-court-readout" aria-live="polite"><span className="text-xs font-medium text-muted">{selected.name}</span><strong className="mt-1 block text-sm font-semibold text-ink">{selected.value}</strong><span className="mt-0.5 block text-xs text-muted">{selected.meta}</span></div>
    </div>
    <div className="mt-3 grid grid-cols-4 gap-1" aria-label="Relay features">{features.map((feature, index) => { const Icon = feature.icon; const current = index === active; return <button key={feature.name} type="button" aria-pressed={current} onClick={() => setActive(index)} className={`pressable flex min-h-10 items-center justify-center gap-1.5 rounded-md px-1.5 text-xs font-medium ${current ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong/60 hover:text-ink"}`}><Icon aria-hidden size={15} weight={current ? "fill" : "regular"} /><span>{feature.name}</span></button>; })}</div>
    <p className="mt-2 hidden min-h-5 text-xs leading-5 text-muted sm:block">{selected.detail}</p>
  </div>;
}
