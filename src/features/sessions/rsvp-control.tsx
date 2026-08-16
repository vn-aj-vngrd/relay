"use client";

import { useActionState, useState } from "react";
import { Check, Question, ShareNetwork, X } from "@phosphor-icons/react";
import { ButtonSpinner } from "@/components/ui/button";
import { rsvpAction } from "./actions";

type Choice = "going" | "maybe" | "declined";
const choices = [
  { value: "going" as const, label: "Join", icon: Check },
  { value: "maybe" as const, label: "Maybe", icon: Question },
  { value: "declined" as const, label: "Can’t make it", icon: X },
];

export function RsvpControl({ sessionId, signedIn = false }: { sessionId: string; signedIn?: boolean }) {
  const [choice, setChoice] = useState<Choice>("going");
  const [state, action, pending] = useActionState(rsvpAction, {});
  const [shareMessage, setShareMessage] = useState("");
  async function share() {
    if (navigator.share) await navigator.share({ title: document.title, url: window.location.href });
    else { await navigator.clipboard.writeText(window.location.href); setShareMessage("Link copied"); }
  }
  return <div>
    <form action={action} className="space-y-3">
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="choice" value={choice} />
      {!signedIn ? <div><label htmlFor={`guest-${sessionId}`} className="text-sm font-semibold">Your name</label><input id={`guest-${sessionId}`} name="guestName" required minLength={2} maxLength={60} autoComplete="name" placeholder="e.g. Mika Reyes…" className="mt-1.5 h-12 w-full rounded-[10px] border border-line bg-surface px-3.5 placeholder:text-muted" /></div> : null}
      <div className="grid grid-cols-3 gap-2">{choices.map(({ value, label, icon: Icon }) => <button type="button" key={value} onClick={() => setChoice(value)} aria-pressed={choice === value} className={`pressable min-h-12 rounded-[10px] border px-2 text-sm font-semibold ${choice === value ? "border-primary bg-primary-soft text-primary" : "border-line bg-surface hover:bg-surface-strong"}`}><Icon className="mr-1 inline" size={16} />{label}</button>)}</div>
      <button type="submit" disabled={pending} className="pressable min-h-12 w-full rounded-[10px] border border-primary bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover disabled:opacity-50">{pending ? <span className="inline-flex items-center justify-center gap-2"><ButtonSpinner />Saving…</span> : choice === "going" ? "Confirm I’m going" : "Save response"}</button>
      {state.error ? <p role="alert" className="text-sm font-medium text-danger">{state.error}</p> : state.success ? <p aria-live="polite" className="text-sm font-medium text-primary">{state.rsvp === "pending" ? "Request sent. The host will approve your spot." : state.rsvp === "waitlisted" ? "The game is full. You’re on the waitlist." : "Response saved."}</p> : null}
    </form>
    <button onClick={share} className="pressable mt-2 min-h-11 w-full rounded-[10px] text-sm font-semibold hover:bg-surface"><ShareNetwork className="mr-2 inline" size={17} />Share game</button>
    <p aria-live="polite" className="min-h-5 text-center text-xs text-primary">{shareMessage}</p>
  </div>;
}
