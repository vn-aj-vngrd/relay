"use client";

import { CheckCircle, Circle } from "@phosphor-icons/react";
import { useActionState } from "react";

import { ButtonSpinner } from "@/components/ui/button";

import { type AttendanceActionState, setAttendanceAction } from "./actions";

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
  const [state, action, pending] = useActionState(setAttendanceAction, {} as AttendanceActionState);
  return (
    <form action={action} className={compact ? "" : "flex min-h-14 flex-wrap items-center gap-3 py-2"}>
      <input type="hidden" name="sessionId" value={sessionId} />
      <input type="hidden" name="sessionPlayerId" value={sessionPlayerId} />
      <input type="hidden" name="present" value={present ? "false" : "true"} />
      {compact ? null : <span className="min-w-0 flex-1 truncate text-sm font-medium">{name}</span>}
      <button
        type="submit"
        disabled={pending}
        aria-label={present ? `Mark ${name} as not here` : `Mark ${name} as here`}
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
        <span role="alert" className={compact ? "ml-2 text-xs text-danger" : "basis-full text-xs text-danger"}>
          {state.error}
        </span>
      ) : null}
    </form>
  );
}
