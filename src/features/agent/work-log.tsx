"use client";

import {
  CaretRight,
  Check,
  Circle,
  WarningCircle,
} from "@phosphor-icons/react";
import { useEffect, useId, useState } from "react";
import { ButtonSpinner } from "@/components/ui/button";
import { type AgentWork, formatWorkDuration, workLabels } from "./work";

export function AgentWorkLog({ work }: { work: AgentWork }) {
  const [now, setNow] = useState(Date.now);
  const [expanded, setExpanded] = useState(false);
  const id = useId();
  const working = work.status === "working";
  useEffect(() => {
    if (!working) return;
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, [working]);
  const label = `${working ? "Working" : "Worked"} for ${formatWorkDuration((work.finishedAt ?? now) - work.startedAt)}`;
  const open = working || expanded;
  return (
    <div className="mb-4 text-sm">
      <div className="border-b border-line pb-2">
        {working ? (
          <p className="py-2 text-muted">{label}</p>
        ) : (
          <button
            type="button"
            className="pressable flex min-h-9 items-center gap-2 rounded-lg text-left text-muted hover:text-ink"
            aria-expanded={open}
            aria-controls={id}
            onClick={() => setExpanded(!expanded)}
          >
            {label}
            {work.status === "stopped"
              ? " · Stopped"
              : work.status === "failed"
                ? " · Interrupted"
                : null}
            <CaretRight
              size={14}
              aria-hidden
              className={open ? "rotate-90" : undefined}
            />
          </button>
        )}
      </div>
      <div id={id} hidden={!open}>
        <ol className="space-y-3 pt-4" aria-label="Agent activity">
          {work.entries.map((entry, index) => (
            <li
              key={`${index}-${entry.step}`}
              className="flex items-center gap-2 text-muted"
            >
              {entry.status === "complete" ? (
                <Check size={15} aria-hidden className="shrink-0" />
              ) : entry.status === "failed" ? (
                <WarningCircle
                  size={15}
                  aria-hidden
                  className="shrink-0 text-danger"
                />
              ) : entry.status === "running" ? (
                <ButtonSpinner className="text-primary" />
              ) : (
                <Circle size={15} aria-hidden className="shrink-0" />
              )}
              <span>{workLabels[entry.step]}</span>
              <span className="sr-only">{entry.status}</span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
