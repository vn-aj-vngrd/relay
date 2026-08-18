"use client";

import { useOptimistic, useRef, useState, useTransition } from "react";
import { ArrowsOutSimple, Minus, Plus, X } from "@phosphor-icons/react";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { SubmitButton } from "@/components/ui/submit-button";
import { changeScore, finishMatch } from "./actions";

type LiveCourtProps = {
  sessionId: string;
  matchId: string;
  number: string;
  teams: [string, string];
  scores: [number, number];
  version: number;
  canScore: boolean;
};

type ScoreboardProps = Omit<LiveCourtProps, "scores" | "version"> & {
  expanded?: boolean;
  scores: [number, number];
  pending: boolean;
  error: string;
  onScore: (side: 0 | 1, amount: number) => void;
  onExpand?: () => void;
  onClose?: () => void;
};

function TeamName({ name }: { name: string }) {
  const players = name.split(" + ");
  return <p className="flex min-h-12 flex-col items-center justify-center text-center text-sm font-semibold leading-5 text-white/82 sm:text-base">
    {players.map((player, index) => <span key={`${player}-${index}`} className="block max-w-full truncate">{index ? <span aria-hidden className="mr-1 text-[var(--scoreboard-line)]">+</span> : null}{player}</span>)}
  </p>;
}

function Scoreboard({ sessionId, matchId, number, teams, scores, canScore, pending, error, onScore, onExpand, onClose, expanded = false }: ScoreboardProps) {
  return <article className={`overflow-hidden border border-line bg-surface ${expanded ? "flex h-full flex-col rounded-none border-0" : "rounded-xl"}`}>
    <header className={`flex shrink-0 items-center justify-between gap-4 border-b border-line ${expanded ? "min-h-16 px-5 sm:px-8" : "min-h-14 px-4"}`}>
      <div className="min-w-0"><p className="sport-label truncate text-primary">{number.toUpperCase()}</p><p className="mt-0.5 text-xs text-muted">Match in progress</p></div>
      <div className="flex shrink-0 items-center gap-2">
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-live"><span className="h-1.5 w-1.5 rounded-full bg-live" />Live</span>
        {onExpand ? <IconTooltip label="Expand scoreboard"><button type="button" onClick={onExpand} aria-label="Expand scoreboard" className="pressable grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"><ArrowsOutSimple aria-hidden size={19} /></button></IconTooltip> : null}
        {onClose ? <button type="button" onClick={onClose} aria-label="Close expanded scoreboard" className="pressable grid h-10 w-10 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"><X aria-hidden size={19} /></button> : null}
      </div>
    </header>

    <div className={`grid shrink-0 grid-cols-2 bg-[var(--scoreboard-field)] text-white ${expanded ? "min-h-0 flex-1" : ""}`}>
      {([0, 1] as const).map((side) => <section key={side} aria-label={teams[side]} className={`flex min-w-0 flex-col ${side === 1 ? "court-rule border-l" : ""}`}>
        <div className={`flex min-h-0 flex-1 flex-col justify-center text-center ${expanded ? "px-5 py-8 sm:px-10" : "px-4 pb-5 pt-6"}`}>
          <TeamName name={teams[side]} />
          <output aria-live="polite" aria-label={`${teams[side]} score ${scores[side]}`} className={`score mt-3 block font-bold leading-none tracking-[-0.055em] ${expanded ? "text-[clamp(7rem,22vw,16rem)]" : "text-[5rem] sm:text-[6.5rem]"}`}>{scores[side]}</output>
        </div>
        {canScore ? <div className="court-rule grid shrink-0 grid-cols-2 border-t"><button disabled={pending} onClick={() => onScore(side, -1)} aria-label={`Subtract a point from ${teams[side]}`} className={`pressable grid place-items-center court-rule border-r text-white/65 hover:bg-white/10 hover:text-white disabled:opacity-40 ${expanded ? "min-h-20" : "min-h-16"}`}><Minus aria-hidden size={expanded ? 24 : 20} /></button><button disabled={pending} onClick={() => onScore(side, 1)} aria-label={`Add a point to ${teams[side]}`} className={`pressable grid place-items-center text-white hover:bg-white/10 disabled:opacity-40 ${expanded ? "min-h-20" : "min-h-16"}`}><Plus aria-hidden size={expanded ? 24 : 20} /></button></div> : null}
      </section>)}
    </div>

    {error ? <p role="alert" className="shrink-0 border-t border-line px-4 py-3 text-sm text-danger">{error}</p> : null}
    {canScore ? <footer className={`shrink-0 border-t border-line ${expanded ? "p-4 sm:px-8" : "p-3"}`}><form action={finishMatch}><input type="hidden" name="sessionId" value={sessionId} /><input type="hidden" name="matchId" value={matchId} /><SubmitButton pendingLabel="Finishing match…" variant="secondary" className="w-full" disabled={scores[0] === scores[1]}>Finish match</SubmitButton></form></footer> : null}
  </article>;
}

export function LiveCourt({ sessionId, matchId, number, teams, scores, version, canScore }: LiveCourtProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
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

  const shared = { sessionId, matchId, number, teams, scores: optimistic, canScore, pending, error, onScore: score };

  return <>
    <Scoreboard {...shared} onExpand={() => dialogRef.current?.showModal()} />
    <dialog ref={dialogRef} onMouseDown={(event) => { if (event.target === event.currentTarget) event.currentTarget.close(); }} aria-label={`${number} expanded scoreboard`} className="m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-surface p-0 text-ink backdrop:bg-black/70 sm:h-[calc(100dvh-2rem)] sm:w-[min(960px,calc(100vw-2rem))] sm:rounded-xl sm:border sm:border-line">
      <Scoreboard {...shared} expanded onClose={() => dialogRef.current?.close()} />
    </dialog>
  </>;
}
