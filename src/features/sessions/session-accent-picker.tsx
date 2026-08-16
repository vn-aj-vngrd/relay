"use client";

import { Check } from "@phosphor-icons/react";
import { useState } from "react";
import { sessionAccents, type SessionAccent } from "./accent";

export function SessionAccentPicker({ defaultValue = "violet" }: { defaultValue?: string }) {
  const fallback = sessionAccents.some((accent) => accent.id === defaultValue) ? defaultValue as SessionAccent : "violet";
  const [selected, setSelected] = useState<SessionAccent>(fallback);
  return <fieldset><legend className="text-sm font-[650]">Game color</legend><p className="mt-1 text-sm text-muted">A quiet accent for this game and its shared link.</p><div className="mt-3 flex flex-wrap gap-2">{sessionAccents.map((accent) => <label key={accent.id} className={`relative grid h-11 w-11 cursor-pointer place-items-center rounded-lg border transition-colors focus-within:outline focus-within:outline-3 focus-within:outline-offset-2 focus-within:outline-primary ${selected === accent.id ? "border-ink" : "border-line hover:border-muted"}`} style={{ backgroundColor: accent.soft }} title={accent.label}><input aria-label={accent.label} type="radio" name="accentColor" value={accent.id} checked={selected === accent.id} onChange={() => setSelected(accent.id)} className="sr-only" /><span aria-hidden className="h-6 w-6 rounded-full" style={{ backgroundColor: accent.solid }} />{selected === accent.id ? <Check aria-hidden size={13} weight="bold" className="absolute text-white" /> : null}</label>)}</div></fieldset>;
}
