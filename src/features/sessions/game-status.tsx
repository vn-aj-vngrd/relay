"use client";

import { useCallback, useSyncExternalStore } from "react";

export type GameLifecycleStatus =
  | "draft"
  | "published"
  | "live"
  | "completed"
  | "cancelled";

export function gameStatusLabel(
  status: GameLifecycleStatus,
  endsAt?: Date | string,
  now = Date.now()
) {
  if (status === "published") {
    // A passed schedule is not evidence that the host ended Play.
    const scheduledEnd =
      endsAt instanceof Date ? endsAt.getTime() : Date.parse(endsAt ?? "");
    return scheduledEnd > now ? "Upcoming" : "Published";
  }
  return {
    draft: "Draft",
    live: "Live",
    completed: "Ended",
    cancelled: "Cancelled",
  }[status];
}

// The server and hydration snapshot deliberately use the truthful, clock-neutral
// Published label. Only after hydration may the local schedule refine it.
const serverUpcomingSnapshot = () => false;

export function useGameStatusLabel(
  status: GameLifecycleStatus,
  endsAt?: Date | string
) {
  const scheduledEnd =
    status === "published"
      ? endsAt instanceof Date
        ? endsAt.getTime()
        : Date.parse(endsAt ?? "")
      : Number.NaN;
  const getSnapshot = useCallback(
    () => scheduledEnd > Date.now(),
    [scheduledEnd]
  );
  const subscribe = useCallback(
    (notify: () => void) => {
      let timer: ReturnType<typeof setTimeout> | undefined;
      const reconcile = () => {
        if (timer !== undefined) clearTimeout(timer);
        notify();
        const remaining = scheduledEnd - Date.now();
        if (remaining > 0) {
          // Browsers overflow longer delays; recheck long schedules in bounded steps.
          timer = setTimeout(reconcile, Math.min(remaining, 2_147_483_647));
        }
      };
      reconcile();
      window.addEventListener("focus", reconcile);
      document.addEventListener("visibilitychange", reconcile);
      return () => {
        if (timer !== undefined) clearTimeout(timer);
        window.removeEventListener("focus", reconcile);
        document.removeEventListener("visibilitychange", reconcile);
      };
    },
    [scheduledEnd]
  );
  const upcoming = useSyncExternalStore(
    subscribe,
    getSnapshot,
    serverUpcomingSnapshot
  );
  return gameStatusLabel(
    status,
    endsAt,
    upcoming ? Number.NEGATIVE_INFINITY : Number.POSITIVE_INFINITY
  );
}

export function GameStatusChip({
  status,
  endsAt,
  className = "",
}: {
  status: GameLifecycleStatus;
  endsAt?: Date | string;
  className?: string;
}) {
  const label = useGameStatusLabel(status, endsAt);
  return (
    <span
      className={`inline-flex w-fit shrink-0 items-center gap-1.5 rounded-full border border-line bg-surface px-2 py-0.5 text-xs font-semibold ${status === "cancelled" ? "text-danger" : "text-ink"} ${className}`}
    >
      {status === "live" ? (
        <span aria-hidden className="h-1.5 w-1.5 rounded-full bg-live" />
      ) : null}
      {label}
    </span>
  );
}
