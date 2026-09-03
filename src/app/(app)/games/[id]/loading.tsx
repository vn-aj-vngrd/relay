import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";
import { SessionAtAGlanceSkeleton } from "@/features/sessions/session-overview";

export default function SessionLoading() {
  return (
    <>
      <GamePageIntro title="Overview" description="The plan, roster, setup progress, and next action for this game." />
      <div
        role="status"
        aria-label="Loading game overview"
        aria-busy="true"
        className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1fr)_340px]"
      >
        <article className="public-session-panel -mx-4 min-w-0 overflow-hidden border-y border-line bg-surface sm:mx-0 sm:rounded-xl sm:border">
          <div
            className="relative overflow-hidden px-4 pb-6 pt-5 sm:px-8 sm:pb-10 sm:pt-7"
            style={{ backgroundColor: "var(--session-cover, var(--court))" }}
          >
            <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
            <Skeleton className="h-3 w-40 bg-white/15" />
            <Skeleton className="mt-3 h-8 w-3/4 bg-white/15 sm:mt-4 sm:h-10" />
            <Skeleton className="mt-2 h-5 w-32 bg-white/15 sm:mt-3 sm:h-6" />
          </div>
          <div className="border-b border-line px-4 py-5 lg:hidden">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-5 w-36" />
            <Skeleton className="mt-3 h-3.5 w-48 max-w-full" />
          </div>
          <div className="px-4 py-5 sm:px-8 sm:py-8">
            <div className="grid grid-cols-2 gap-x-4 gap-y-6 border-b border-line pb-7">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="col-span-2 flex gap-3 sm:col-span-1">
                  <Skeleton className="h-5 w-5 shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-3/4" />
                    <Skeleton className="h-3.5 w-1/2" />
                  </div>
                </div>
              ))}
            </div>
            <SessionAtAGlanceSkeleton />
          </div>
        </article>
        <aside className="space-y-7 lg:sticky lg:top-6 lg:self-start">
          <div className="hidden rounded-xl border border-line p-4 sm:p-5 lg:block">
            <Skeleton className="h-4 w-24" />
            <Skeleton className="mt-2 h-5 w-44" />
            <Skeleton className="mt-3 h-3.5 w-full" />
            <Skeleton className="mt-2 h-3.5 w-4/5" />
            <Skeleton className="mt-5 h-9 w-full" />
          </div>
          <div>
            <Skeleton className="h-5 w-32" />
            <Skeleton className="mt-2 h-3.5 w-24" />
            <div className="mt-3 divide-y divide-line border-y border-line">
              {Array.from({ length: 5 }, (_, index) => (
                <div key={index} className="flex min-h-14 items-center gap-3">
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 flex-1" />
                  <Skeleton className="h-3 w-10" />
                </div>
              ))}
            </div>
          </div>
        </aside>
      </div>
    </>
  );
}
