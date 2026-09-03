import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";
import { SessionAtAGlanceSkeleton } from "@/features/sessions/session-overview";

function JoinPanelSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <div
      className={
        mobile
          ? "public-session-section border-b border-line lg:hidden"
          : "public-session-panel public-session-overview-card rounded-xl border border-line bg-surface p-5"
      }
    >
      <div
        className={`flex items-start justify-between gap-4 ${mobile ? "mb-5" : "mb-5 border-b border-line pb-5"}`}
      >
        <div className="space-y-2">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="h-3.5 w-32" />
        </div>
        <Skeleton className="h-4 w-20" />
      </div>
      <Skeleton className="h-3.5 w-20" />
      <Skeleton className="mt-2 h-12 w-full" />
      <Skeleton className="mt-2 h-3 w-4/5" />
      <div className="mt-3 grid grid-cols-3 gap-2">
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
        <Skeleton className="h-9" />
      </div>
      <Skeleton className="mt-3 h-9 w-full" />
      <Skeleton className="mx-auto mt-5 h-4 w-24" />
    </div>
  );
}

function RosterSkeleton({ mobile = false }: { mobile?: boolean }) {
  return (
    <section
      className={
        mobile ? "public-session-section border-b border-line lg:hidden" : ""
      }
    >
      <div className="mb-3 flex items-end justify-between gap-3">
        <div className="space-y-2">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-3.5 w-40" />
        </div>
        <div className="flex -space-x-2">
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
          <Skeleton className="h-8 w-8 rounded-full" />
        </div>
      </div>
      <div className="divide-y divide-line border-y border-line">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="flex min-h-14 items-center gap-3 py-2">
            <Skeleton className="h-8 w-8 rounded-full" />
            <Skeleton className="h-3.5 flex-1" />
            <Skeleton className="h-3 w-10" />
          </div>
        ))}
      </div>
      <Skeleton className="mx-auto mt-3 h-9 w-32" />
    </section>
  );
}

export default function PublicPlanLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
    >
      <div
        role="status"
        aria-label="Loading game plan"
        aria-busy="true"
        className="mx-auto w-full max-w-6xl pb-12 pt-4 sm:px-6 sm:pt-8"
      >
        <div className="px-4 sm:px-0">
          <GamePageIntro
            title="Overview"
            description="The plan, roster, availability, and what you need before the game."
          />
        </div>
        <div className="grid gap-6 lg:grid-cols-[1fr_350px]">
          <article className="public-session-panel public-session-overview-card min-w-0 overflow-hidden border-y border-line bg-surface sm:rounded-xl sm:border">
            <div
              className="public-session-hero relative min-h-44 overflow-hidden px-4 pb-6 pt-5 sm:min-h-48 sm:px-8 sm:pb-10 sm:pt-7"
              style={{ backgroundColor: "var(--court)" }}
            >
              <div className="absolute inset-x-0 bottom-0 h-1 bg-primary" />
              <Skeleton className="h-3 w-36 bg-white/15" />
              <Skeleton className="mt-8 h-10 w-3/4 bg-white/15" />
              <Skeleton className="mt-3 h-4 w-32 bg-white/15" />
            </div>
            <div className="border-b border-line px-4 py-3 lg:hidden">
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="public-session-content px-5 py-6 sm:px-8 sm:py-8">
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
              <JoinPanelSkeleton mobile />
              <RosterSkeleton mobile />
            </div>
          </article>
          <aside className="hidden space-y-7 self-start lg:sticky lg:top-6 lg:block">
            <JoinPanelSkeleton />
            <RosterSkeleton />
          </aside>
        </div>
      </div>
    </main>
  );
}
