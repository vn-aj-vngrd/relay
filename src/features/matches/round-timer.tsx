"use client";

import { ClockCountdown } from "@phosphor-icons/react";
import { useEffect, useState } from "react";

export function roundTimeRemaining(
  startedAt: string,
  durationMinutes: number,
  now = Date.now()
) {
  return Math.max(
    0,
    new Date(startedAt).getTime() + durationMinutes * 60_000 - now
  );
}

function clockLabel(milliseconds: number) {
  const seconds = Math.ceil(milliseconds / 1000);
  const minutes = Math.floor(seconds / 60);
  return `${String(minutes).padStart(2, "0")}:${String(seconds % 60).padStart(2, "0")}`;
}

export function RoundTimer({
  startedAt,
  durationMinutes,
}: {
  startedAt: string;
  durationMinutes: number;
}) {
  const [now, setNow] = useState(() => Date.now());
  const endAt = new Date(startedAt).getTime() + durationMinutes * 60_000;
  const remaining = Math.max(0, endAt - now);

  useEffect(() => {
    if (Date.now() >= endAt) return;
    const timer = window.setInterval(() => {
      const next = Date.now();
      setNow(next);
      if (next >= endAt) window.clearInterval(timer);
    }, 1000);
    return () => window.clearInterval(timer);
  }, [endAt]);

  const ended = remaining === 0;
  return (
    <div
      className={`flex min-h-14 items-center justify-between gap-4 border-y px-3 py-2.5 ${ended ? "border-warning/35 bg-warning/8" : "border-line bg-surface-strong"}`}
    >
      <div className="flex items-center gap-2.5">
        <ClockCountdown
          aria-hidden
          size={20}
          className={ended ? "text-warning" : "text-primary"}
        />
        <div>
          <p className="text-sm font-semibold">
            {ended ? "Round time" : "Round timer"}
          </p>
          <p className="mt-0.5 text-xs text-muted">
            {ended
              ? "Finish the rally, then enter the result."
              : "Shared across every active court."}
          </p>
        </div>
      </div>
      <time
        className={`score text-2xl font-bold tabular-nums ${ended ? "text-warning" : "text-ink"}`}
        dateTime={`PT${Math.ceil(remaining / 1000)}S`}
        aria-label={
          ended
            ? "Round time has ended"
            : `${Math.ceil(remaining / 60_000)} minutes remaining`
        }
      >
        {ended ? "TIME" : clockLabel(remaining)}
      </time>
    </div>
  );
}
