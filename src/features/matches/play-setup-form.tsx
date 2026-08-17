"use client";

import { ArrowsClockwise, CrownSimple, Stack } from "@phosphor-icons/react";
import { useActionState, useState } from "react";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { startLiveMode, type LiveModeActionState } from "./actions";
import type { PlayMode } from "./rotation";

const options: Array<{ mode: PlayMode; title: string; description: string; icon: typeof Stack }> = [
  { mode: "queue", title: "Paddle Stack", description: "Keep courts moving as players arrive, rest, or leave.", icon: Stack },
  { mode: "random", title: "Mix It Up", description: "Rotate together with new partners and fair rests each round.", icon: ArrowsClockwise },
  { mode: "king_of_court", title: "Court Climb", description: "Winners move toward Court 1 and partners split every round.", icon: CrownSimple },
];

export function PlaySetupForm({ sessionId, playerCount, courtCount }: { sessionId: string; playerCount: number; courtCount: number }) {
  const [mode, setMode] = useState<PlayMode>("queue");
  const [state, action] = useActionState(startLiveMode, {} as LiveModeActionState);
  const climbPlayers = courtCount * 4;
  const climbAvailable = courtCount >= 2 && playerCount === climbPlayers;

  return <form action={action} className="mt-8 text-left">
    <input type="hidden" name="sessionId" value={sessionId} />
    <fieldset>
      <legend className="sr-only">Play setup</legend>
      <div className="divide-y divide-line border-y border-line">{options.map(({ mode: value, title, description, icon: Icon }) => {
        const disabled = value === "king_of_court" && !climbAvailable;
        const selected = mode === value;
        return <label key={value} className={`flex min-h-20 gap-3 py-4 ${disabled ? "cursor-not-allowed opacity-55" : "cursor-pointer"}`}>
          <input type="radio" name="mode" value={value} checked={selected} disabled={disabled} onChange={() => setMode(value)} className="sr-only" />
          <span aria-hidden className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg ${selected ? "bg-primary text-white" : "bg-surface-strong text-muted"}`}><Icon size={18} weight={selected ? "bold" : "regular"} /></span>
          <span className="min-w-0 flex-1"><span className="flex items-center justify-between gap-3"><strong className="font-[680]">{title}</strong><span aria-hidden className={`h-4 w-4 rounded-full border-4 ${selected ? "border-primary bg-surface" : "border-line bg-surface"}`} /></span><span className="mt-1 block text-sm leading-5 text-muted">{description}</span>{value === "king_of_court" && !climbAvailable ? <span className="mt-1.5 block text-xs font-medium text-warning">{courtCount < 2 ? "Needs at least 2 courts." : `Needs exactly ${climbPlayers} active players for ${courtCount} courts.`}</span> : null}</span>
        </label>;
      })}</div>
    </fieldset>

    {mode === "queue" ? <div className="mt-5"><SelectField id="queue-rule" name="queueRule" label="Queue rule" defaultValue="adaptive" options={[{ value: "adaptive", label: "Adaptive — Relay responds to the queue" }, { value: "four_off", label: "Four rotate — a fresh group every match" }, { value: "winner_stays", label: "Winners stay — split and take the next two" }]} /><p className="mt-1.5 text-xs leading-5 text-muted">Adaptive uses winners-stay for a short queue and rotates all four when four or more players are waiting.</p></div> : null}

    <div className="mt-6 flex flex-col-reverse gap-3 border-t border-line pt-5 sm:flex-row sm:items-center sm:justify-between"><p className="text-sm text-muted">{playerCount} going · {courtCount} {courtCount === 1 ? "court" : "courts"}</p><SubmitButton pendingLabel="Starting Live Mode…" className="w-full sm:w-auto">Start Live Mode</SubmitButton></div>
    {state.error ? <p role="alert" className="mt-3 text-sm font-medium text-danger">{state.error}</p> : null}
  </form>;
}
