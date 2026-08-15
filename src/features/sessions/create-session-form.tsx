"use client";

import { useActionState, useState } from "react";
import { ChevronDown, MapPin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSessionAction } from "./actions";

const fieldClass = "mt-1.5 h-12 w-full rounded-xl border border-line bg-surface px-3.5 text-base text-ink placeholder:text-muted focus:border-primary focus:outline-none";
const labelClass = "text-sm font-semibold";

export type CreateSessionDefaults = { date: string; title?: string; venue?: string; capacity?: number; courts?: number; start?: string; end?: string; cost?: number };

export function CreateSessionForm({ defaults }: { defaults: CreateSessionDefaults }) {
  const [more, setMore] = useState(false);
  const [state, action, pending] = useActionState(createSessionAction, {});
  return <form className="space-y-8" action={action} autoComplete="off">
    {state.error ? <p role="alert" className="rounded-xl bg-[oklch(.96_.035_25)] p-3 text-sm font-medium text-danger">{state.error}</p> : null}
    <section className="space-y-5">
      <div><label className={labelClass} htmlFor="title">Game name</label><input className={fieldClass} id="title" name="title" required defaultValue={defaults.title ?? "Saturday Night Pickle"} /></div>
      <div><label className={labelClass} htmlFor="venue">Venue</label><div className="relative"><MapPin className="pointer-events-none absolute left-3.5 top-[17px] text-muted" size={18} /><input className={`${fieldClass} pl-10`} id="venue" name="venue" required placeholder="Search a venue…" defaultValue={defaults.venue} /></div></div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3"><div className="min-w-0"><label className={labelClass} htmlFor="date">Date</label><input className={fieldClass} id="date" name="date" type="date" defaultValue={defaults.date} required /></div><div className="min-w-0"><label className={labelClass} htmlFor="capacity">Player limit</label><input className={fieldClass} id="capacity" name="capacity" type="number" min="2" max="40" defaultValue={defaults.capacity ?? 8} required /></div></div>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3"><div className="min-w-0"><label className={labelClass} htmlFor="start">Starts</label><input className={`${fieldClass} score`} id="start" name="start" type="time" defaultValue={defaults.start ?? "19:00"} required /></div><div className="min-w-0"><label className={labelClass} htmlFor="end">Ends</label><input className={`${fieldClass} score`} id="end" name="end" type="time" defaultValue={defaults.end ?? "21:00"} required /></div></div>
      <div><label className={labelClass} htmlFor="courts">Number of courts</label><select className={fieldClass} id="courts" name="courts" defaultValue={String(defaults.courts ?? 2)}><option value="1">1 court</option><option value="2">2 courts</option><option value="3">3 courts</option><option value="4">4 courts</option></select></div>
    </section>

    <section className="border-y border-line py-2">
      <button type="button" onClick={() => setMore((open) => !open)} aria-expanded={more} className="pressable flex min-h-14 w-full items-center justify-between text-left font-semibold"><span><span className="block">More details</span><span className="mt-0.5 block text-sm font-normal text-muted">Cost, court numbers, booking, notes</span></span><ChevronDown className={`transition-transform ${more ? "rotate-180" : ""}`} size={20} /></button>
      {more ? <div className="space-y-5 pb-5 pt-3">
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 sm:gap-3"><div className="min-w-0"><label className={labelClass} htmlFor="cost">Estimated cost/player</label><div className="relative"><span className="absolute left-3.5 top-[14px] text-muted">₱</span><input className={`${fieldClass} score pl-8`} id="cost" name="cost" type="number" min="0" step="0.01" inputMode="decimal" placeholder="300…" defaultValue={defaults.cost} /></div></div><div className="min-w-0"><label className={labelClass} htmlFor="court-numbers">Court numbers</label><input className={fieldClass} id="court-numbers" name="courtNumbers" placeholder="2, 3…" /></div></div>
        <div><label className={labelClass} htmlFor="notes">Note for players</label><textarea className="mt-1.5 min-h-28 w-full resize-y rounded-xl border border-line bg-surface px-3.5 py-3 text-base placeholder:text-muted focus:border-primary focus:outline-none" id="notes" name="notes" placeholder="Parking tips, what to bring, or anything your crew should know…" /></div>
        <label className="flex min-h-12 items-start gap-3 text-sm"><input type="checkbox" name="booked" className="mt-0.5 h-5 w-5 accent-[var(--primary)]" /><span><strong className="block">Court is already booked</strong><span className="mt-0.5 block text-muted">You can add a reference or screenshot after publishing.</span></span></label>
      </div> : null}
    </section>

    <div className="flex items-center justify-end gap-2 border-t border-line pt-5 sm:border-0 sm:pt-0"><Button type="submit" name="intent" value="draft" variant="quiet" disabled={pending}>Save draft</Button><Button type="submit" name="intent" value="publish" className="min-w-36 sm:min-w-40" disabled={pending}>{pending ? "Publishing…" : "Publish game"}</Button></div>
  </form>;
}
