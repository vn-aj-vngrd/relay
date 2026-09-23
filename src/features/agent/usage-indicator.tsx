"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Tooltip } from "@/components/ui/tooltip";
import type { AgentUsageSummary } from "./allowance";
import { AgentUsageSummaryView } from "./usage-summary";

export function AgentUsageIndicator({ usage }: { usage: AgentUsageSummary }) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const id = useId();
  const fraction =
    usage.limit > 0
      ? Math.min(1, Math.max(0, (usage.used + usage.reserved) / usage.limit))
      : 0;
  const percent = Math.round(fraction * 100);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  const details = (
    <>
      <p className="mb-1 text-xs font-medium">
        {usage.limit > 0
          ? `${percent}% of message allowance in use`
          : "No messages available"}
      </p>
      <AgentUsageSummaryView usage={usage} />
    </>
  );
  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-label={`Message allowance: ${usage.used} of ${usage.limit} messages used${usage.reserved ? `, ${usage.reserved} in progress` : ""}`}
        aria-expanded={open}
        aria-controls={open ? id : undefined}
        onBlur={(event) => {
          if (!root.current?.contains(event.relatedTarget)) setOpen(false);
        }}
        onClick={() => setOpen(!open)}
        className="compact-control pressable flex size-9 items-center justify-center rounded-full text-muted hover:bg-surface-strong hover:text-ink"
      >
        <svg width="18" height="18" viewBox="0 0 20 20" aria-hidden="true">
          <circle
            cx="10"
            cy="10"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="opacity-25"
          />
          <circle
            cx="10"
            cy="10"
            r="7"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            pathLength="100"
            strokeDasharray={`${fraction * 100} 100`}
            transform="rotate(-90 10 10)"
            className={usage.remaining === 0 ? "text-danger" : "text-primary"}
          />
        </svg>
      </button>
      <Tooltip
        content={<div className="max-w-64 text-center">{details}</div>}
        anchor="previous"
        side="top"
        align="center"
        disabled={open}
      />
      {open ? (
        <div
          id={id}
          role="region"
          aria-label="Message allowance details"
          className="absolute bottom-full right-0 z-30 mb-2 w-64 max-w-[calc(100vw-3rem)] rounded-xl border border-line bg-surface p-3 text-ink shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
        >
          {details}
        </div>
      ) : null}
    </div>
  );
}
