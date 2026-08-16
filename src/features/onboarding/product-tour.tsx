"use client";

import { ArrowLeft, ArrowRight, Check, LinkSimple, SquaresFour } from "@phosphor-icons/react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { PendingSubmit } from "@/components/ui/pending-submit";
import { SubmitButton } from "@/components/ui/submit-button";
import { completeProductTour } from "./actions";

const slides = [
  { title: "One link carries the plan", description: "Friends see when, where, who’s playing, open spots, and cost before they sign in." },
  { title: "Courts stay easy to read", description: "Live Mode keeps active matches, scores, and the waiting stack together beside the court." },
  { title: "The night stays together", description: "Track the shared cost, keep results and photos, then bring the setup back with Play Again." },
] as const;

function InviteVisual() {
  return <div className="overflow-hidden rounded-xl border border-line bg-surface"><div className="border-b border-line px-4 py-3 text-xs font-semibold text-muted">SHARED GAME LINK</div><div className="p-5"><div className="flex items-start justify-between gap-4"><div><p className="text-xs text-muted">SAT · 7:00 PM</p><h3 className="mt-1 text-xl font-semibold">Saturday Night Pickle</h3><p className="mt-1 text-sm text-muted">Central Pickle · Courts 2 & 3</p></div><span className="rounded-full bg-primary-soft px-2 py-1 text-xs font-semibold text-primary">2 spots left</span></div><div className="mt-6 flex -space-x-2">{["VJ", "AJ", "MR", "JL"].map((name) => <span key={name} className="grid h-8 w-8 place-items-center rounded-full border-2 border-surface bg-surface-strong text-[10px] font-bold">{name}</span>)}</div><div className="mt-5 grid grid-cols-3 gap-2"><span className="rounded-md bg-primary px-2 py-2 text-center text-xs font-semibold text-white">Join</span><span className="rounded-md border border-line px-2 py-2 text-center text-xs font-semibold">Maybe</span><span className="rounded-md border border-line px-2 py-2 text-center text-xs font-semibold">Share</span></div></div></div>;
}

function CourtsVisual() {
  return <div className="rounded-xl bg-court p-5 text-white"><div className="flex items-center justify-between"><p className="sport-label text-court-line">Live mode</p><span className="flex items-center gap-1.5 text-xs"><span className="h-2 w-2 rounded-full bg-live"/>2 courts</span></div><div className="mt-5 grid gap-3 sm:grid-cols-2"><div className="rounded-lg border border-white/10 p-4"><p className="text-xs text-white/55">COURT 1</p><div className="mt-3 flex items-end justify-between"><p className="text-sm leading-6">Van + AJ<br/><span className="text-white/55">John + Mika</span></p><strong className="score text-3xl">8–6</strong></div></div><div className="rounded-lg border border-white/10 p-4"><p className="text-xs text-white/55">COURT 2</p><div className="mt-3 flex items-end justify-between"><p className="text-sm leading-6">Chris + Josh<br/><span className="text-white/55">Mark + Kyle</span></p><strong className="score text-3xl">10–10</strong></div></div></div><div className="mt-3 flex gap-3 rounded-lg bg-white/6 px-4 py-3 text-sm"><span className="text-signal">Up next</span><span>Sarah · James · Carlo · Bea</span></div></div>;
}

function MemoryVisual() {
  return <div className="overflow-hidden rounded-xl border border-line bg-surface"><div className="grid sm:grid-cols-[1fr_.9fr]"><div className="min-h-48 bg-court p-5 text-white"><p className="sport-label text-court-line">Completed</p><p className="mt-12 text-2xl font-semibold">Saturday Night Pickle</p><p className="mt-2 text-sm text-white/60">12 matches · 8 friends · 3 hours</p></div><div className="p-5"><div className="flex items-center justify-between border-b border-line pb-4"><span className="text-sm text-muted">Court split</span><strong className="score">₱300 each</strong></div><div className="space-y-3 py-4 text-sm"><p className="flex items-center gap-2"><Check className="text-success"/>Payment settled</p><p className="flex items-center gap-2"><Check className="text-success"/>Scores saved</p><p className="flex items-center gap-2"><Check className="text-success"/>Photos together</p></div><p className="border-t border-line pt-4 text-sm font-semibold text-primary">Play again →</p></div></div></div>;
}

export function ProductTour({ replay = false }: { replay?: boolean }) {
  const [step, setStep] = useState(0);
  const slide = slides[step];
  return <div className="w-full max-w-[900px]">
    <div className="mb-9 flex items-center justify-between"><div className="flex gap-1.5" aria-label={`Tour step ${step + 1} of ${slides.length}`}>{slides.map((item, index) => <span key={item.title} className={`h-1.5 w-10 rounded-full ${index <= step ? "bg-primary" : "bg-surface-strong"}`} />)}</div><form action={completeProductTour}><input type="hidden" name="destination" value="/home" /><PendingSubmit pendingLabel={replay ? "Closing…" : "Skipping…"} className="inline-flex min-h-11 items-center gap-2 text-sm font-medium text-muted hover:text-ink">{replay ? "Close tour" : "Skip tour"}</PendingSubmit></form></div>
    <div className="grid items-center gap-10 lg:grid-cols-[.72fr_1.28fr] lg:gap-16"><section><p className="score text-sm font-semibold text-primary">{step + 1} / {slides.length}</p><h1 className="mt-4 text-[2rem] font-[680] leading-[1.05] tracking-[-0.035em] sm:text-[2.5rem]">{slide.title}</h1><p className="mt-5 text-base leading-7 text-muted">{slide.description}</p>{step === 0 ? <p className="mt-5 flex items-center gap-2 text-sm font-medium"><LinkSimple className="text-primary"/>Guests can RSVP by name</p> : step === 1 ? <p className="mt-5 flex items-center gap-2 text-sm font-medium"><SquaresFour className="text-primary"/>Large, courtside controls</p> : null}</section><div>{step === 0 ? <InviteVisual /> : step === 1 ? <CourtsVisual /> : <MemoryVisual />}</div></div>
    <div className="mt-10 flex items-center justify-between border-t border-line pt-5">{step ? <Button variant="quiet" onClick={() => setStep((current) => current - 1)}><ArrowLeft size={16}/>Back</Button> : <span/>}{step < slides.length - 1 ? <Button onClick={() => setStep((current) => current + 1)}>Next<ArrowRight size={16}/></Button> : <div className="flex gap-2"><form action={completeProductTour}><input type="hidden" name="destination" value="/home"/><SubmitButton pendingLabel="Opening Home…" variant="secondary">Go to Home</SubmitButton></form><form action={completeProductTour}><input type="hidden" name="destination" value="/games/new"/><SubmitButton pendingLabel="Opening form…">Create a game<ArrowRight size={16}/></SubmitButton></form></div>}</div>
  </div>;
}
