"use client";

import { useState } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

export function LiveCourt({ number, teams, initial = [8, 6] }: { number: number; teams: [string, string]; initial?: [number, number] }) {
  const [score, setScore] = useState(initial);
  function change(side: 0 | 1, amount: number) { setScore((current) => { const next: [number, number] = [...current]; next[side] = Math.max(0, next[side] + amount); return next; }); }
  return <article className="overflow-hidden rounded-2xl bg-court text-white">
    <header className="flex items-center justify-between border-b border-white/15 px-5 py-4"><div><p className="score text-sm font-bold text-[#8dd6c1]">COURT {number}</p><p className="mt-1 text-xs text-white/60">Match in progress</p></div><span className="inline-flex items-center gap-1.5 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-[#f18369]" />Live</span></header>
    <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
      {[0, 1].map((side) => <div key={side} className={side === 1 ? "border-l border-white/15" : ""}>
        <div className="px-3 pb-3 pt-5 text-center sm:px-5"><p className="min-h-10 text-sm font-semibold leading-5 text-white/80">{teams[side]}</p><output aria-live="polite" aria-label={`${teams[side]} score ${score[side]}`} className="score mt-3 block text-7xl font-bold leading-none sm:text-8xl">{score[side]}</output></div>
        <div className="grid grid-cols-2 border-t border-white/15"><button onClick={() => change(side as 0 | 1, -1)} aria-label={`Subtract a point from ${teams[side]}`} className="pressable grid min-h-16 place-items-center border-r border-white/15 text-white/70 hover:bg-white/10 hover:text-white"><Minus /></button><button onClick={() => change(side as 0 | 1, 1)} aria-label={`Add a point to ${teams[side]}`} className="pressable grid min-h-16 place-items-center text-white hover:bg-white/10"><Plus /></button></div>
      </div>)}
      <span aria-hidden className="self-center px-2 text-sm font-bold text-white/40">–</span>
    </div>
    <footer className="border-t border-white/15 p-3"><Button variant="secondary" className="w-full border-white/20 bg-white hover:bg-white/90" style={{ color: "oklch(0.19 0.018 185)" }}>Finish match</Button></footer>
  </article>;
}
