"use client";

import { useOptimistic, useState, useTransition } from "react";
import { Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { changeScore, finishMatch } from "./actions";

export function LiveCourt({ sessionId, matchId, number, teams, scores, version, canScore }: { sessionId: string; matchId: string; number: string; teams: [string, string]; scores: [number, number]; version: number; canScore: boolean }) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [optimistic, updateOptimistic] = useOptimistic(scores, (current, change: { side: 0 | 1; amount: number }) => { const next: [number, number] = [...current]; next[change.side] = Math.max(0, next[change.side] + change.amount); return next; });
  function score(side: 0 | 1, amount: number) {
    startTransition(async () => {
      updateOptimistic({ side, amount });
      const form = new FormData(); form.set("sessionId", sessionId); form.set("matchId", matchId); form.set("team", side === 0 ? "A" : "B"); form.set("amount", String(amount)); form.set("version", String(version));
      try { setError(""); await changeScore(form); }
      catch { setError("Score changed elsewhere. The latest score has been loaded."); }
    });
  }
  return <article className="overflow-hidden rounded-2xl bg-court text-white"><header className="flex items-center justify-between border-b border-white/15 px-5 py-4"><div><p className="score text-sm font-bold text-[#8dd6c1]">{number.toUpperCase()}</p><p className="mt-1 text-xs text-white/60">Match in progress</p></div><span className="inline-flex items-center gap-1.5 text-sm font-semibold"><span className="h-2 w-2 rounded-full bg-[#f18369]" />Live</span></header><div className="grid grid-cols-[1fr_auto_1fr] items-stretch">{([0, 1] as const).map((side) => <div key={side} className={side === 1 ? "border-l border-white/15" : ""}><div className="px-3 pb-3 pt-5 text-center sm:px-5"><p className="min-h-10 text-sm font-semibold leading-5 text-white/80">{teams[side]}</p><output aria-live="polite" aria-label={`${teams[side]} score ${optimistic[side]}`} className="score mt-3 block text-7xl font-bold leading-none sm:text-8xl">{optimistic[side]}</output></div><div className="grid grid-cols-2 border-t border-white/15"><button disabled={pending || !canScore} onClick={() => score(side, -1)} aria-label={`Subtract a point from ${teams[side]}`} className="pressable grid min-h-16 place-items-center border-r border-white/15 text-white/70 hover:bg-white/10 hover:text-white disabled:opacity-40"><Minus /></button><button disabled={pending || !canScore} onClick={() => score(side, 1)} aria-label={`Add a point to ${teams[side]}`} className="pressable grid min-h-16 place-items-center text-white hover:bg-white/10 disabled:opacity-40"><Plus /></button></div></div>)}<span aria-hidden className="self-center px-2 text-sm font-bold text-white/40">–</span></div>{error ? <p role="alert" className="border-t border-white/15 px-4 py-3 text-sm text-[#ff9d88]">{error}</p> : null}{canScore ? <footer className="border-t border-white/15 p-3"><form action={finishMatch}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="matchId" value={matchId} /><Button variant="secondary" className="w-full border-white/20 bg-white hover:bg-white/90" style={{ color: "oklch(0.19 0.018 185)" }} disabled={optimistic[0] === optimistic[1]}>Finish match</Button></form></footer> : null}</article>;
}
