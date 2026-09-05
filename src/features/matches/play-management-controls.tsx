"use client";

import {
  ArrowDown,
  ArrowLineDown,
  ArrowLineUp,
  ArrowUp,
  LockSimple,
  LockSimpleOpen,
  Warning,
} from "@phosphor-icons/react";
import { useActionState, useEffect, useId, useRef } from "react";

import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  cancelMatchAction,
  type PlayManagementActionState,
  reorderQueueAction,
  setCourtAvailabilityAction,
} from "./actions";

const initialState: PlayManagementActionState = {};

export function CourtAvailabilityControl({
  sessionId,
  courtId,
  label,
  version,
  available,
  active,
}: {
  sessionId: string;
  courtId: string;
  label: string;
  version: number;
  available: boolean;
  active: boolean;
}) {
  const [state, action] = useActionState(
    setCourtAvailabilityAction,
    initialState
  );
  const nextAvailable = !available;
  return (
    <form
      noValidate
      action={action}
      className="flex min-h-14 flex-wrap items-center gap-3 py-2"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="courtId" value={courtId} />
      <input type="hidden" name="version" value={version} />
      <input type="hidden" name="available" value={String(nextAvailable)} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold">{label}</p>
        <p className="text-xs text-muted">
          {available
            ? "Available for new matches"
            : active
              ? "Closing after this match"
              : "Unavailable for new matches"}
        </p>
      </div>
      <SubmitButton
        pendingLabel="Updating…"
        variant="secondary"
        aria-label={`${nextAvailable ? "Reopen" : "Close"} ${label} for new matches`}
      >
        {nextAvailable ? (
          <LockSimpleOpen aria-hidden size={16} />
        ) : (
          <LockSimple aria-hidden size={16} />
        )}
        {nextAvailable ? "Reopen" : active ? "Close after match" : "Close"}
      </SubmitButton>
      {state.error ? (
        <p role="alert" className="basis-full text-xs text-danger">
          {state.error}
        </p>
      ) : state.message ? (
        <p role="status" className="basis-full text-xs text-primary">
          {state.message}
        </p>
      ) : null}
    </form>
  );
}

export function QueueOrderControls({
  sessionId,
  sessionPlayerId,
  version,
  name,
}: {
  sessionId: string;
  sessionPlayerId: string;
  version: number;
  name: string;
}) {
  const [state, action] = useActionState(reorderQueueAction, initialState);
  return (
    <form
      noValidate
      action={action}
      className="flex flex-wrap items-center justify-end gap-1"
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sessionPlayerId" value={sessionPlayerId} />
      <input type="hidden" name="version" value={version} />
      {[
        ["top", "Move to top", ArrowLineUp],
        ["up", "Move up", ArrowUp],
        ["down", "Move down", ArrowDown],
        ["end", "Move to end", ArrowLineDown],
      ].map(([move, label, Icon]) => (
        <Button
          key={move as string}
          type="submit"
          name="move"
          value={move as string}
          variant="quiet"
          className="h-11 min-h-11 w-11 px-0 sm:h-9 sm:min-h-9 sm:w-9"
          aria-label={`${label as string}: ${name}`}
          title={label as string}
        >
          <Icon aria-hidden size={16} />
        </Button>
      ))}
      {state.error ? (
        <p role="alert" className="basis-full text-right text-xs text-danger">
          {state.error}
        </p>
      ) : null}
    </form>
  );
}

export function MatchCancellationControl({
  sessionId,
  matchId,
  courtLabel,
  version,
  synchronized,
}: {
  sessionId: string;
  matchId: string;
  courtLabel: string;
  version: number;
  synchronized: boolean;
}) {
  const [state, action, pending] = useActionState(
    cancelMatchAction,
    initialState
  );
  const dialogRef = useRef<HTMLDialogElement>(null);
  const titleId = useId();
  const descriptionId = useId();

  useEffect(() => {
    if (state.message) dialogRef.current?.close();
  }, [state.message]);

  return (
    <>
      <Button
        type="button"
        variant="quiet"
        className="text-danger"
        onClick={() => dialogRef.current?.showModal()}
      >
        Cancel {synchronized ? "rotation" : "match"}
      </Button>
      <Dialog
        ref={dialogRef}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <form noValidate action={action} className="p-5 sm:p-6">
          <input type="hidden" name="sessionId" value={sessionId} />
          <input type="hidden" name="matchId" value={matchId} />
          <input type="hidden" name="version" value={version} />
          <div className="flex items-start gap-3">
            <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-warning/12 text-warning">
              <Warning aria-hidden size={19} weight="fill" />
            </span>
            <div className="min-w-0">
              <h2 id={titleId} className="text-lg font-[680]">
                Cancel {synchronized ? "this rotation" : `${courtLabel} match`}?
              </h2>
              <p
                id={descriptionId}
                className="mt-2 text-sm leading-6 text-muted"
              >
                {synchronized
                  ? "Every match in this rotation will be voided and excluded from standings. Players return to waiting without undoing newer queue changes."
                  : "The score will be voided and the players will return to waiting without undoing newer queue changes."}
              </p>
            </div>
          </div>
          <label
            htmlFor={`cancel-reason-${matchId}`}
            className="mt-5 block text-sm font-semibold"
          >
            Reason
          </label>
          <textarea
            id={`cancel-reason-${matchId}`}
            name="reason"
            required
            minLength={2}
            maxLength={240}
            rows={3}
            className="mt-2 w-full resize-y rounded-lg border border-line bg-surface px-3 py-2 text-base text-ink outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
            placeholder="Court became unavailable"
          />
          {state.error ? (
            <p role="alert" className="mt-2 text-sm text-danger">
              {state.error}
            </p>
          ) : null}
          <div className="mt-6 flex justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              onClick={() => dialogRef.current?.close()}
              disabled={pending}
            >
              Keep playing
            </Button>
            <SubmitButton pendingLabel="Cancelling…" variant="danger">
              Cancel {synchronized ? "rotation" : "match"}
            </SubmitButton>
          </div>
        </form>
      </Dialog>
    </>
  );
}
