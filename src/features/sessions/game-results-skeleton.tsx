"use client";

import { Skeleton } from "@/components/shared/skeleton";
import { useGameViewMode } from "./game-view-menu";

export function GameResultsSkeleton({
  discovery = false,
  invitations = false,
}: {
  discovery?: boolean;
  invitations?: boolean;
}) {
  const mode = useGameViewMode();
  return (
    <div
      role="status"
      aria-label={
        invitations
          ? "Loading invitations"
          : discovery
            ? "Loading open games"
            : "Loading games"
      }
      aria-busy="true"
      data-testid="game-results-skeleton"
    >
      {mode === "calendar" ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <div>
            <div className="mb-4 flex items-center justify-between">
              <Skeleton className="h-6 w-40" />
              <Skeleton className="h-9 w-28" />
            </div>
            <div className="grid grid-cols-7 gap-px overflow-hidden rounded-xl border border-line bg-line">
              {Array.from({ length: 7 }, (_, index) => (
                <div key={index} className="bg-surface p-2">
                  <Skeleton className="mx-auto h-3 w-6" />
                </div>
              ))}
              {Array.from({ length: 35 }, (_, index) => (
                <div
                  key={index}
                  className="min-h-16 bg-surface p-2 sm:min-h-24"
                >
                  <Skeleton className="h-3 w-4" />
                </div>
              ))}
            </div>
          </div>
          <div>
            <Skeleton className="mb-4 h-5 w-36" />
            <Skeleton className="h-24 w-full" />
          </div>
        </div>
      ) : mode === "grid" ? (
        <div className="grid gap-3 min-[380px]:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="rounded-xl border border-line p-4 sm:p-5"
            >
              <Skeleton className="mb-4 h-4 w-20" />
              <Skeleton className="h-5 w-4/5" />
              <Skeleton className="mt-3 h-3 w-3/5" />
              <Skeleton className="mt-2 h-3 w-4/5" />
              <div className="mt-5 border-t border-line pt-3">
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="divide-y divide-line border-y border-line">
          {Array.from({ length: 4 }, (_, index) =>
            discovery ? (
              <div
                key={index}
                className="px-2 py-4 sm:grid sm:min-h-24 sm:grid-cols-[minmax(0,1.4fr)_minmax(9rem,1fr)_auto] sm:items-center sm:gap-6 sm:px-3"
              >
                <div className="flex items-center gap-2">
                  <Skeleton className="h-7 w-1 shrink-0 rounded-full" />
                  <div className="flex-1">
                    <Skeleton className="h-4 w-4/5" />
                    <Skeleton className="mt-2 h-3 w-1/2" />
                  </div>
                </div>
                <div className="mt-3 sm:mt-0">
                  <Skeleton className="h-3.5 w-4/5" />
                  <Skeleton className="mt-2 h-3 w-3/5" />
                </div>
                <div className="mt-3 border-t border-line pt-3 sm:mt-0 sm:border-0 sm:pt-0">
                  <Skeleton className="h-3.5 w-16" />
                  <Skeleton className="mt-2 h-3 w-28" />
                </div>
              </div>
            ) : (
              <div
                key={index}
                className="flex min-h-[4.5rem] items-center gap-3 py-3.5 sm:min-h-20 sm:gap-4 sm:px-3 sm:py-4"
              >
                <Skeleton className="hidden h-4 w-20 shrink-0 sm:block" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-2/5" />
                  <Skeleton className="mt-2 h-3.5 w-3/5" />
                </div>
                <Skeleton className="hidden h-4 w-20 sm:block" />
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}
