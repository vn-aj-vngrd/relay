"use client";

import {
  ArrowClockwise,
  CheckCircle,
  CheckSquare,
  Circle,
  Pause,
  Square,
} from "@phosphor-icons/react";
import { useActionState } from "react";

import { ButtonSpinner } from "@/components/ui/button";
import { SubmitButton } from "@/components/ui/submit-button";

import {
  type AttendanceActionState,
  setAllAttendanceAction,
  setAttendanceAction,
  setPlayAvailabilityAction,
} from "./actions";

export function AttendanceBulkActions({
  sessionId,
  allPresent,
}: {
  sessionId: string;
  allPresent: boolean;
}) {
  const [state, action] = useActionState(
    setAllAttendanceAction,
    {} as AttendanceActionState
  );
  return (
    <div>
      <form noValidate action={action}>
        <input type="hidden" name="sessionId" value={sessionId} />
        <input
          type="hidden"
          name="present"
          value={allPresent ? "false" : "true"}
        />
        <SubmitButton
          pendingLabel="Updating…"
          variant="quiet"
          className="whitespace-nowrap"
        >
          {allPresent ? (
            <Square aria-hidden size={16} />
          ) : (
            <CheckSquare aria-hidden size={16} />
          )}
          {allPresent ? "Mark all not here" : "Mark all here"}
        </SubmitButton>
      </form>
      {state.error ? (
        <p
          role="alert"
          className="mt-1 text-right text-xs font-medium text-danger"
        >
          {state.error}
        </p>
      ) : null}
    </div>
  );
}

export function PlayAvailabilityControl({
  sessionId,
  sessionPlayerId,
  name,
  queueState,
  playerState,
  compact = false,
}: {
  sessionId: string;
  sessionPlayerId: string;
  name: string;
  queueState?: string | null;
  playerState: string;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(
    setPlayAvailabilityAction,
    {} as AttendanceActionState
  );
  const deferred = queueState === "playing" && playerState === "resting";
  const ready = queueState === "playing" || queueState === "waiting";
  const intent = deferred || !ready ? "ready" : "sit_out";
  const status = deferred
    ? "Sitting out after match"
    : queueState === "playing"
      ? "On court"
      : queueState === "waiting"
        ? "Waiting"
        : "Sitting out";
  const actionLabel = deferred
    ? "Stay in"
    : queueState === "playing"
      ? "Sit out after match"
      : queueState === "waiting"
        ? "Sit out"
        : "Rejoin queue";

  return (
    <form
      noValidate
      action={action}
      className={
        compact ? "" : "flex min-h-16 flex-wrap items-center gap-3 py-2"
      }
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sessionPlayerId" value={sessionPlayerId} />
      <input type="hidden" name="intent" value={intent} />
      <div className={compact ? "mb-2" : "min-w-0 flex-1"}>
        {compact ? null : (
          <p className="truncate text-sm font-medium">{name}</p>
        )}
        <p className="text-xs font-medium text-muted">{status}</p>
      </div>
      <button
        type="submit"
        disabled={pending}
        aria-label={`${actionLabel} for ${name}`}
        className="pressable inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-2.5 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink"
      >
        {pending ? (
          <ButtonSpinner />
        ) : intent === "ready" ? (
          <ArrowClockwise aria-hidden size={16} />
        ) : (
          <Pause aria-hidden size={16} weight="fill" />
        )}
        {actionLabel}
      </button>
      {state.error ? (
        <span
          role="alert"
          className={
            compact
              ? "ml-2 text-xs text-danger"
              : "basis-full text-xs text-danger"
          }
        >
          {state.error}
        </span>
      ) : state.message ? (
        <span
          role="status"
          className={
            compact
              ? "ml-2 text-xs text-primary"
              : "basis-full text-xs text-primary"
          }
        >
          {state.message}
        </span>
      ) : null}
    </form>
  );
}

export function AttendanceToggle({
  sessionId,
  sessionPlayerId,
  name,
  present,
  compact = false,
}: {
  sessionId: string;
  sessionPlayerId: string;
  name: string;
  present: boolean;
  compact?: boolean;
}) {
  const [state, action, pending] = useActionState(
    setAttendanceAction,
    {} as AttendanceActionState
  );
  return (
    <form
      noValidate
      action={action}
      className={
        compact ? "" : "flex min-h-14 flex-wrap items-center gap-3 py-2"
      }
    >
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sessionPlayerId" value={sessionPlayerId} />
      <input type="hidden" name="present" value={present ? "false" : "true"} />
      {compact ? null : (
        <span className="min-w-0 flex-1 truncate text-sm font-medium">
          {name}
        </span>
      )}
      <button
        type="submit"
        disabled={pending}
        aria-label={
          present ? `Mark ${name} as not here` : `Mark ${name} as here`
        }
        className={`pressable inline-flex min-h-9 items-center justify-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold ${present ? "bg-primary-soft text-primary" : "border border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink"}`}
      >
        {pending ? (
          <ButtonSpinner />
        ) : present ? (
          <CheckCircle aria-hidden size={16} weight="fill" />
        ) : (
          <Circle aria-hidden size={16} />
        )}
        {present ? "Here" : "Not here"}
      </button>
      {state.error ? (
        <span
          role="alert"
          className={
            compact
              ? "ml-2 text-xs text-danger"
              : "basis-full text-xs text-danger"
          }
        >
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
