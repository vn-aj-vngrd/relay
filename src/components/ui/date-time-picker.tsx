"use client";

import { CalendarBlank, CaretDown, CaretLeft, CaretRight, Check, Clock } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

const weekdays = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const dateFormatter = new Intl.DateTimeFormat("en-PH", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
const monthFormatter = new Intl.DateTimeFormat("en-PH", { month: "long", year: "numeric" });
const fullDateFormatter = new Intl.DateTimeFormat("en-PH", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
const timeFormatter = new Intl.DateTimeFormat("en-PH", { hour: "numeric", minute: "2-digit" });

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return year && month && day ? new Date(year, month - 1, day) : null;
}

function dateValue(value: Date) {
  return `${value.getFullYear()}-${String(value.getMonth() + 1).padStart(2, "0")}-${String(value.getDate()).padStart(2, "0")}`;
}

function timeLabel(value: string) {
  const [hour, minute] = value.split(":").map(Number);
  return Number.isFinite(hour) && Number.isFinite(minute) ? timeFormatter.format(new Date(2026, 0, 1, hour, minute)) : "Choose a time";
}

function useDismiss(open: boolean, close: () => void, root: React.RefObject<HTMLDivElement | null>) {
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => { if (!root.current?.contains(event.target as Node)) close(); };
    const key = (event: KeyboardEvent) => { if (event.key === "Escape") close(); };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => { document.removeEventListener("pointerdown", pointer); document.removeEventListener("keydown", key); };
  }, [close, open, root]);
}

const triggerClass = "mt-1.5 flex h-11 w-full items-center gap-2 rounded-lg border bg-surface px-3 text-left text-[15px] text-ink focus:outline-none";

export function DatePickerField({ id, name = id, label, defaultValue = "", error, describedBy }: { id: string; name?: string; label: string; defaultValue?: string; error?: string; describedBy?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const [view, setView] = useState(() => parseDate(defaultValue) ?? new Date());
  const root = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), root);
  const selected = parseDate(value);
  const first = new Date(view.getFullYear(), view.getMonth(), 1);
  const days = new Date(view.getFullYear(), view.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: first.getDay() + days }, (_, index) => index < first.getDay() ? null : new Date(view.getFullYear(), view.getMonth(), index - first.getDay() + 1));
  const today = dateValue(new Date());

  return <div ref={root} className="relative min-w-0">
    <label className="block text-sm font-[650]" htmlFor={id}>{label}</label>
    <input type="hidden" name={name} value={value} />
    <button id={id} type="button" aria-haspopup="dialog" aria-expanded={open} aria-describedby={describedBy} onClick={() => setOpen((current) => !current)} className={`${triggerClass} ${error ? "border-danger ring-2 ring-danger/10" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"}`}>
      <CalendarBlank aria-hidden size={17} className="shrink-0 text-muted" /><span className={`flex-1 ${selected ? "" : "text-muted"}`}>{selected ? dateFormatter.format(selected) : "Choose a date"}</span><CaretDown aria-hidden size={14} className="text-muted" />
    </button>
    {open ? <div role="dialog" aria-label={`${label} calendar`} className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 w-auto rounded-xl border border-line bg-surface p-3 shadow-[0_8px_24px_rgb(13_15_20/.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+.5rem)] sm:w-80">
      <div className="flex items-center justify-between"><button type="button" aria-label="Previous month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() - 1, 1))} className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"><CaretLeft aria-hidden size={16} /></button><p className="text-sm font-[650]">{monthFormatter.format(view)}</p><button type="button" aria-label="Next month" onClick={() => setView(new Date(view.getFullYear(), view.getMonth() + 1, 1))} className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"><CaretRight aria-hidden size={16} /></button></div>
      <div className="mt-2 grid grid-cols-7 text-center text-[11px] font-semibold text-muted">{weekdays.map((day) => <span key={day} className="py-1.5">{day}</span>)}</div>
      <div className="grid grid-cols-7">{cells.map((day, index) => day ? <button key={dateValue(day)} type="button" aria-label={fullDateFormatter.format(day)} aria-pressed={dateValue(day) === value} onClick={() => { setValue(dateValue(day)); setOpen(false); }} className={`pressable relative grid h-9 place-items-center rounded-md text-sm ${dateValue(day) === value ? "bg-primary font-semibold text-white" : "hover:bg-surface-strong"}`}>{day.getDate()}{dateValue(day) === today && dateValue(day) !== value ? <span aria-hidden className="absolute bottom-1 h-1 w-1 rounded-full bg-primary" /> : null}</button> : <span key={`blank-${index}`} />)}</div>
      <div className="mt-2 border-t border-line pt-2"><button type="button" onClick={() => { const now = new Date(); setView(now); setValue(dateValue(now)); setOpen(false); }} className="pressable min-h-9 rounded-md px-2.5 text-xs font-semibold text-primary hover:bg-primary-soft">Today</button></div>
    </div> : null}
  </div>;
}

const timeOptions = Array.from({ length: 96 }, (_, index) => `${String(Math.floor(index / 4)).padStart(2, "0")}:${String((index % 4) * 15).padStart(2, "0")}`);

export function TimePickerField({ id, name = id, label, defaultValue = "", error, describedBy }: { id: string; name?: string; label: string; defaultValue?: string; error?: string; describedBy?: string }) {
  const [value, setValue] = useState(defaultValue);
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  useDismiss(open, () => setOpen(false), root);
  return <div ref={root} className="relative min-w-0">
    <label className="block text-sm font-[650]" htmlFor={id}>{label}</label>
    <input type="hidden" name={name} value={value} />
    <button id={id} type="button" aria-haspopup="listbox" aria-expanded={open} aria-describedby={describedBy} onClick={() => setOpen((current) => !current)} className={`${triggerClass} score ${error ? "border-danger ring-2 ring-danger/10" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"}`}><Clock aria-hidden size={17} className="shrink-0 text-muted" /><span className={`flex-1 ${value ? "" : "font-sans text-muted"}`}>{timeLabel(value)}</span><CaretDown aria-hidden size={14} className="text-muted" /></button>
    {open ? <div role="listbox" aria-label={`${label} options`} className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 max-h-[55svh] w-auto overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(13_15_20/.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+.5rem)] sm:max-h-64 sm:w-full sm:min-w-44">{timeOptions.map((option) => <button key={option} type="button" role="option" aria-selected={value === option} onClick={() => { setValue(option); setOpen(false); }} className={`pressable flex min-h-10 w-full items-center justify-between rounded-lg px-3 text-sm ${value === option ? "bg-primary-soft font-semibold text-primary" : "hover:bg-surface-strong"}`}><span className="score">{timeLabel(option)}</span>{value === option ? <Check aria-hidden size={14} /> : null}</button>)}</div> : null}
  </div>;
}
