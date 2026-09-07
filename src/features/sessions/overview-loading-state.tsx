"use client";

import { CheckCircle } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";
import { useGameLifecycle } from "./game-lifecycle-context";
import { GameStatusChip } from "./game-status";
import { SessionAtAGlanceSkeleton } from "./session-overview";

function FinalRosterSkeleton({ shared }: { shared: boolean }) {
  return (
    <section
      aria-label="Final roster"
      className={shared ? "public-session-section border-b border-line" : ""}
    >
      <h2 className="text-lg font-bold">Final roster</h2>
      <Skeleton className="mt-1 h-4 w-28" />
      <div className="mt-3 divide-y divide-line border-y border-line">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex min-h-14 items-center gap-3 py-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-4 flex-1" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
      <Skeleton className="mx-auto mt-2 h-9 w-32" />
    </section>
  );
}

export function OverviewLoadingState({
  children,
  shared = false,
}: {
  children: ReactNode;
  shared?: boolean;
}) {
  const status = useGameLifecycle();
  if (status !== "completed") return children;

  const content = (
    <>
      <div className={shared ? "px-4 sm:px-0" : ""}>
        <GamePageIntro title="Overview" />
      </div>
      <div
        role="status"
        aria-label={shared ? "Loading game plan" : "Loading game overview"}
        aria-busy="true"
      >
        <div className={`mb-5 sm:mb-6 ${shared ? "px-4 sm:px-0" : ""}`}>
          <section
            aria-label="Game ended"
            className="rounded-xl border border-line bg-surface p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <CheckCircle
                aria-hidden
                size={21}
                weight="fill"
                className="mt-0.5 shrink-0 text-muted"
              />
              <div className="min-w-0 flex-1">
                <h2 className="text-lg font-[680]">Game ended</h2>
                <p className="mt-1 text-sm leading-6 text-muted">
                  Joining is closed. View the recap for this game.
                </p>
                <Skeleton className="mt-4 h-9 w-28" />
              </div>
            </div>
          </section>
        </div>
        <div
          className={
            shared
              ? "grid gap-6"
              : "grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
          }
        >
          <article
            className={
              shared
                ? "public-session-panel public-session-overview-card min-w-0 overflow-hidden border-y border-line bg-surface sm:rounded-xl sm:border"
                : "public-session-panel -mx-4 min-w-0 overflow-hidden border-y border-line bg-surface sm:mx-0 sm:rounded-xl sm:border"
            }
          >
            <div className="public-session-hero relative min-h-44 overflow-hidden bg-[var(--session-cover,var(--court))] px-4 pb-6 pt-5 sm:min-h-48 sm:px-8 sm:pb-10 sm:pt-7">
              <Skeleton className="h-3 w-40 bg-white/15" />
              <Skeleton className="mt-8 h-10 w-3/4 bg-white/15" />
              <div className="relative mt-3">
                <GameStatusChip status={status} />
              </div>
              <Skeleton className="mt-3 h-4 w-32 bg-white/15" />
            </div>
            <div
              className={
                shared
                  ? "public-session-content px-5 py-6 sm:px-8 sm:py-8"
                  : "px-4 py-5 sm:px-8 sm:py-8"
              }
            >
              <div className="public-session-plan grid grid-cols-2 gap-x-4 gap-y-6 border-b border-line">
                {Array.from({ length: 4 }, (_, index) => (
                  <div
                    key={index}
                    className={`flex gap-3 ${index < 2 ? "col-span-2 sm:col-span-1" : "col-span-2 min-[360px]:col-span-1"}`}
                  >
                    <Skeleton className="h-5 w-5 shrink-0" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3.5 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
              <SessionAtAGlanceSkeleton />
              {shared ? <FinalRosterSkeleton shared /> : null}
            </div>
          </article>
          {!shared ? (
            <aside className="space-y-7 lg:sticky lg:top-6 lg:self-start">
              <FinalRosterSkeleton shared={false} />
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );

  return shared ? (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
    >
      <div className="mx-auto w-full max-w-6xl pb-12 pt-4 sm:px-6 sm:pt-8">
        {content}
      </div>
    </main>
  ) : (
    content
  );
}
