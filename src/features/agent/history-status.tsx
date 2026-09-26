"use client";

import { CheckCircle, SpinnerGap, WarningCircle } from "@phosphor-icons/react";
import type { AgentConversationSummary } from "./history-types";

export function AgentHistoryStatus({
  status,
  iconOnly = false,
}: {
  status: AgentConversationSummary["status"];
  iconOnly?: boolean;
}) {
  if (status === "idle") return null;
  const label =
    status === "working"
      ? "Working"
      : status === "failed"
        ? "Needs attention"
        : "Done";
  if (iconOnly) {
    return (
      <span
        role="img"
        aria-label={label}
        className="inline-flex size-4 shrink-0 items-center justify-center"
      >
        {status === "working" ? (
          <SpinnerGap
            size={14}
            className="animate-spin text-muted motion-reduce:animate-none"
            aria-hidden
          />
        ) : status === "failed" ? (
          <WarningCircle size={14} className="text-danger" aria-hidden />
        ) : (
          <CheckCircle size={14} className="text-primary" aria-hidden />
        )}
      </span>
    );
  }
  return (
    <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted">
      {status === "working" ? (
        <SpinnerGap
          size={14}
          className="animate-spin motion-reduce:animate-none"
          aria-hidden
        />
      ) : status === "failed" ? (
        <WarningCircle size={14} className="text-danger" aria-hidden />
      ) : (
        <CheckCircle size={14} className="text-primary" aria-hidden />
      )}
      {label}
    </span>
  );
}
