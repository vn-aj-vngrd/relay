"use client";

import { useActionState, useEffect, useState } from "react";
import { ChevronDown, MapPin, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { createSessionAction, type SessionActionState } from "./actions";

const labelClass = "text-sm font-[650]";

function fieldClass(error?: string) {
  return `mt-1.5 h-12 w-full rounded-xl border bg-surface px-3.5 text-base text-ink placeholder:text-muted focus:outline-none ${error ? "border-danger focus:border-danger focus:ring-3 focus:ring-danger/15" : "border-line focus:border-primary focus:ring-3 focus:ring-primary/15"}`;
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return message ? <p id={id} className="mt-1.5 text-sm font-medium text-danger">{message}</p> : null;
}

function errorFor(state: SessionActionState, field: string) {
  return state.fieldErrors?.[field]?.[0];
}

function QuantityInput({ id, label, hint, min, max, defaultValue, error }: { id: string; label: string; hint: string; min: number; max: number; defaultValue: number; error?: string }) {
  const [value, setValue] = useState(String(defaultValue));
  const numericValue = Number(value);
  const describedBy = `${id}-hint${error ? ` ${id}-error` : ""}`;
  const changeBy = (amount: number) => {
    const current = Number.isFinite(numericValue) ? numericValue : min;
    setValue(String(Math.max(min, Math.min(max, current + amount))));
  };

  return <div className="min-w-0">
    <label className={labelClass} htmlFor={id}>{label}</label>
    <p id={`${id}-hint`} className="mt-1 text-sm text-muted">{hint}</p>
    <div className={`mt-2 inline-flex h-12 items-stretch overflow-hidden rounded-xl border bg-surface ${error ? "border-danger ring-3 ring-danger/10" : "border-line focus-within:border-primary focus-within:ring-3 focus-within:ring-primary/15"}`}>
      <button type="button" onClick={() => changeBy(-1)} disabled={numericValue <= min} aria-label={`Decrease ${label.toLowerCase()}`} className="pressable grid w-12 place-items-center border-r border-line text-muted hover:bg-surface-strong hover:text-ink disabled:opacity-35"><Minus aria-hidden size={17} /></button>
      <input id={id} name={id} type="number" inputMode="numeric" min={min} max={max} step="1" value={value} onChange={(event) => setValue(event.target.value)} required aria-invalid={Boolean(error)} aria-describedby={describedBy} className="score w-20 appearance-none bg-transparent px-2 text-center text-base font-semibold text-ink outline-none [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none" />
      <button type="button" onClick={() => changeBy(1)} disabled={numericValue >= max} aria-label={`Increase ${label.toLowerCase()}`} className="pressable grid w-12 place-items-center border-l border-line text-muted hover:bg-surface-strong hover:text-ink disabled:opacity-35"><Plus aria-hidden size={17} /></button>
    </div>
    <FieldError id={`${id}-error`} message={error} />
  </div>;
}

export type CreateSessionDefaults = { date: string; title?: string; venue?: string; capacity?: number; courts?: number; start?: string; end?: string; cost?: number };

export function CreateSessionForm({ defaults }: { defaults: CreateSessionDefaults }) {
  const [more, setMore] = useState(false);
  const [state, action, pending] = useActionState(createSessionAction, {});

  useEffect(() => {
    const firstInvalid = Object.entries(state.fieldErrors ?? {}).find(([, messages]) => messages.length)?.[0];
    if (firstInvalid) document.getElementById(firstInvalid)?.focus();
  }, [state.fieldErrors]);

  const titleError = errorFor(state, "title");
  const venueError = errorFor(state, "venue");
  const dateError = errorFor(state, "date");
  const startError = errorFor(state, "start");
  const endError = errorFor(state, "end");
  const capacityError = errorFor(state, "capacity");
  const courtsError = errorFor(state, "courts");
  const costError = errorFor(state, "cost");
  const notesError = errorFor(state, "notes");
  const value = (field: string, fallback = "") => state.values?.[field] ?? fallback;
  const advancedOpen = more || Boolean(costError || notesError || value("cost") || value("courtNumbers") || value("notes") || value("booked"));

  return <form className="space-y-8" action={action} autoComplete="off" noValidate>
    {state.error ? <p role="alert" className="rounded-xl bg-danger/8 px-4 py-3 text-sm font-medium leading-5 text-danger ring-1 ring-danger/15">{state.error}</p> : null}

    <section className="space-y-6 rounded-2xl bg-surface-strong p-5 sm:p-6" aria-labelledby="game-basics-heading">
      <div><h2 id="game-basics-heading" className="text-lg font-[680]">Game details</h2><p className="mt-1 text-sm text-muted">The essentials your friends see on the invite.</p></div>
      <div>
        <label className={labelClass} htmlFor="title">Game name</label>
        <input className={fieldClass(titleError)} id="title" name="title" required minLength={2} maxLength={80} defaultValue={value("title", defaults.title ?? "Saturday Night Pickle")} aria-invalid={Boolean(titleError)} aria-describedby={titleError ? "title-error" : undefined} />
        <FieldError id="title-error" message={titleError} />
      </div>
      <div>
        <label className={labelClass} htmlFor="venue">Venue</label>
        <div className="relative"><MapPin className="pointer-events-none absolute left-3.5 top-[17px] text-muted" size={18} /><input className={`${fieldClass(venueError)} pl-10`} id="venue" name="venue" required maxLength={120} placeholder="Search or enter a venue…" defaultValue={value("venue", defaults.venue)} aria-invalid={Boolean(venueError)} aria-describedby={venueError ? "venue-error" : undefined} /></div>
        <FieldError id="venue-error" message={venueError} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0"><label className={labelClass} htmlFor="date">Date</label><input className={fieldClass(dateError)} id="date" name="date" type="date" defaultValue={value("date", defaults.date)} required aria-invalid={Boolean(dateError)} aria-describedby={dateError ? "date-error" : undefined} /><FieldError id="date-error" message={dateError} /></div>
        <QuantityInput id="capacity" label="Player limit" hint="Going players before waitlisting." min={2} max={40} defaultValue={Number(value("capacity", String(defaults.capacity ?? 8)))} error={capacityError} />
      </div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
        <div className="min-w-0"><label className={labelClass} htmlFor="start">Starts</label><input className={`${fieldClass(startError)} score`} id="start" name="start" type="time" defaultValue={value("start", defaults.start ?? "19:00")} required aria-invalid={Boolean(startError)} aria-describedby={startError ? "start-error" : undefined} /><FieldError id="start-error" message={startError} /></div>
        <div className="min-w-0"><label className={labelClass} htmlFor="end">Ends</label><input className={`${fieldClass(endError)} score`} id="end" name="end" type="time" defaultValue={value("end", defaults.end ?? "21:00")} required aria-invalid={Boolean(endError)} aria-describedby={endError ? "end-error" : undefined} /><FieldError id="end-error" message={endError} /></div>
      </div>
      <QuantityInput id="courts" label="Court quantity" hint="The number of courts available to your group." min={1} max={20} defaultValue={Number(value("courts", String(defaults.courts ?? 2)))} error={courtsError} />
    </section>

    <section className="rounded-2xl border border-line bg-surface px-4 sm:px-5">
      <button type="button" onClick={() => setMore((open) => !open)} aria-expanded={advancedOpen} className="pressable flex min-h-14 w-full items-center justify-between text-left font-semibold"><span><span className="block">More details</span><span className="mt-0.5 block text-sm font-normal text-muted">Cost, court numbers, booking, and notes</span></span><ChevronDown className={`transition-transform ${advancedOpen ? "rotate-180" : ""}`} size={20} /></button>
      {advancedOpen ? <div className="space-y-6 pb-5 pt-4">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 sm:gap-4">
          <div className="min-w-0"><label className={labelClass} htmlFor="cost">Estimated cost per player</label><div className="relative"><span className="absolute left-3.5 top-[14px] text-muted">₱</span><input className={`${fieldClass(costError)} score pl-8`} id="cost" name="cost" type="number" min="0" step="0.01" inputMode="decimal" placeholder="300" defaultValue={value("cost", defaults.cost == null ? "" : String(defaults.cost))} aria-invalid={Boolean(costError)} aria-describedby={costError ? "cost-error" : undefined} /></div><FieldError id="cost-error" message={costError} /></div>
          <div className="min-w-0"><label className={labelClass} htmlFor="court-numbers">Court labels</label><input className={fieldClass()} id="court-numbers" name="courtNumbers" placeholder="2, 3, Center" defaultValue={value("courtNumbers")} /><p className="mt-1.5 text-sm text-muted">Optional names shown in Live Mode.</p></div>
        </div>
        <div><label className={labelClass} htmlFor="notes">Note for players</label><textarea className={`${fieldClass(notesError)} min-h-28 resize-y py-3`} id="notes" name="notes" maxLength={1200} defaultValue={value("notes")} placeholder="Parking tips, what to bring, or anything your crew should know…" aria-invalid={Boolean(notesError)} aria-describedby={notesError ? "notes-error" : undefined} /><FieldError id="notes-error" message={notesError} /></div>
        <label className="flex min-h-12 cursor-pointer items-start gap-3 text-sm"><input type="checkbox" name="booked" defaultChecked={value("booked") === "on"} className="mt-0.5 h-5 w-5 accent-[var(--primary)]" /><span><strong className="block">Court is already booked</strong><span className="mt-0.5 block text-muted">You can add a reference or screenshot after publishing.</span></span></label>
      </div> : null}
    </section>

    <div className="app-chrome sticky bottom-0 z-10 -mx-4 flex items-center justify-end gap-2 border-t border-line px-4 py-3 safe-bottom sm:static sm:mx-0 sm:border-0 sm:bg-transparent sm:px-0 sm:py-0 sm:backdrop-blur-none"><Button type="submit" name="intent" value="draft" variant="quiet" disabled={pending}>Save draft</Button><Button type="submit" name="intent" value="publish" className="min-w-36 sm:min-w-40" disabled={pending}>{pending ? "Publishing…" : "Publish game"}</Button></div>
  </form>;
}
