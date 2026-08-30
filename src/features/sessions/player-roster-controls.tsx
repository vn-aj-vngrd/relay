"use client";

import { Check, LockKey, LockKeyOpen, UserMinus, UserPlus, X } from "@phosphor-icons/react";
import { useActionState, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { SelectField } from "@/components/ui/select-field";
import { SubmitButton } from "@/components/ui/submit-button";
import { playingExperienceOptions } from "@/features/players/playing-experience";

import {
  addPlayerAction,
  approvePlayerAction,
  removePlayerAction,
  type SessionActionState,
  toggleRosterLockAction,
} from "./actions";

export function AddPlayerForm({ sessionId }: { sessionId: string }) {
  const [state, action] = useActionState<SessionActionState, FormData>(addPlayerAction, {});
  const [playerEntry, setPlayerEntry] = useState("");
  const isRelayInvite = playerEntry.trimStart().startsWith("@");

  return (
    <form action={action} className="mt-4">
      <input type="hidden" name="sessionId" value={sessionId} />
      <div className="grid gap-2 sm:grid-cols-[minmax(0,1fr)_260px_auto] sm:items-end">
        <div className="min-w-0">
          <label htmlFor="player-entry" className="sr-only">
            Guest name or Relay username
          </label>
          <input
            id="player-entry"
            name="playerEntry"
            required
            minLength={2}
            maxLength={60}
            autoComplete="off"
            spellCheck={!isRelayInvite}
            value={playerEntry}
            onChange={(event) => setPlayerEntry(event.target.value)}
            aria-describedby="player-entry-hint"
            placeholder="Guest name or @username"
            className="h-11 w-full min-w-0 rounded-lg border border-line bg-surface px-3 text-base placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 sm:text-sm"
          />
        </div>
        <SelectField
          key={isRelayInvite ? "relay" : "guest"}
          id="guest-player-experience"
          name="skillLevel"
          label="Guest playing experience"
          hideLabel
          disabled={isRelayInvite}
          defaultValue=""
          className="!mt-0"
          options={[
            { value: "", label: isRelayInvite ? "Uses Relay profile" : "Guest experience (optional)" },
            ...playingExperienceOptions.map(({ value, label }) => ({ value, label })),
          ]}
        />
        <SubmitButton
          pendingLabel={isRelayInvite ? "Inviting…" : "Adding…"}
          variant="secondary"
          className="h-11 min-h-11 w-full sm:w-auto"
        >
          <UserPlus aria-hidden size={17} />
          {isRelayInvite ? "Invite" : "Add"}
        </SubmitButton>
      </div>
      <p id="player-entry-hint" className="mt-2 text-sm leading-5 text-muted">
        Use @username to invite a Relay player. Plain names are added as guests.
      </p>
      {state.error ? (
        <p role="alert" className="mt-2 text-sm font-medium text-danger">
          {state.error}
        </p>
      ) : state.success ? (
        <p role="status" className="mt-2 text-sm font-medium text-success">
          {state.playerOutcome === "invited" ? "Invitation sent." : "Guest added."}
        </p>
      ) : null}
    </form>
  );
}

export function PendingPlayerActions({ sessionId, playerId }: { sessionId: string; playerId: string }) {
  const [approveState, approveAction] = useActionState<SessionActionState, FormData>(approvePlayerAction, {});
  const [removeState, removeAction] = useActionState<SessionActionState, FormData>(removePlayerAction, {});
  return (
    <div>
      <div className="flex gap-2">
        <form action={approveAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="sessionPlayerId" value={playerId} />
          <SubmitButton pendingLabel="Approving…" className="min-h-9 px-3">
            <Check aria-hidden size={16} />
            Approve
          </SubmitButton>
        </form>
        <form action={removeAction}>
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="sessionPlayerId" value={playerId} />
          <SubmitButton pendingLabel="Rejecting…" variant="quiet" className="min-h-9 px-3 text-danger">
            <X aria-hidden size={16} />
            Reject
          </SubmitButton>
        </form>
      </div>
      {approveState.error || removeState.error ? (
        <p role="alert" className="mt-1 text-xs font-medium text-danger">
          {approveState.error ?? removeState.error}
        </p>
      ) : null}
    </div>
  );
}

export function RemovePlayerButton({
  sessionId,
  playerId,
  name,
}: {
  sessionId: string;
  playerId: string;
  name: string;
}) {
  const [state, action] = useActionState<SessionActionState, FormData>(removePlayerAction, {});
  const dialogRef = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    if (state.success) dialogRef.current?.close();
  }, [state.success]);
  return (
    <>
      <IconTooltip label={`Remove ${name}`}>
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          aria-label={`Remove ${name}`}
          className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-danger/8 hover:text-danger"
        >
          <UserMinus aria-hidden size={17} />
        </button>
      </IconTooltip>
      <dialog
        ref={dialogRef}
        aria-labelledby={`remove-${playerId}-title`}
        aria-describedby={`remove-${playerId}-description`}
        className="m-auto w-[calc(100%-2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-[0_8px_24px_oklch(0.1_0.02_250/.16)] backdrop:bg-ink/35"
      >
        <form action={action} className="p-5 sm:p-6">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="sessionPlayerId" value={playerId} />
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-danger/10 text-danger">
              <UserMinus aria-hidden size={18} />
            </span>
            <div>
              <h2 id={`remove-${playerId}-title`} className="text-lg font-[680]">
                Remove {name}?
              </h2>
              <p id={`remove-${playerId}-description`} className="mt-2 text-sm leading-6 text-muted">
                They’ll lose their spot and payment assignment. If there is a waitlist, the next player may be promoted.
              </p>
            </div>
          </div>
          {state.error ? (
            <p role="alert" className="mt-4 text-sm font-medium text-danger">
              {state.error}
            </p>
          ) : null}
          <div className="mt-7 flex justify-end gap-2">
            <Button type="button" variant="secondary" onClick={() => dialogRef.current?.close()}>
              Cancel
            </Button>
            <SubmitButton pendingLabel="Removing…" variant="danger">
              Remove player
            </SubmitButton>
          </div>
        </form>
      </dialog>
    </>
  );
}

export function RosterLockButton({ sessionId, locked }: { sessionId: string; locked: boolean }) {
  return (
    <form action={toggleRosterLockAction}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <SubmitButton pendingLabel={locked ? "Unlocking…" : "Locking…"} variant="secondary">
        {locked ? <LockKeyOpen aria-hidden size={17} /> : <LockKey aria-hidden size={17} />}
        {locked ? "Unlock roster" : "Lock roster"}
      </SubmitButton>
    </form>
  );
}
