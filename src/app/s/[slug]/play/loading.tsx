import { Skeleton } from "@/components/shared/skeleton";
import { LiveCourtSkeleton } from "@/features/matches/live-court-skeleton";

export default function PublicPlayLoading() {
  return (
    <main id="main-content" className="public-session-page min-h-full bg-surface pb-6 sm:pb-8">
      <div
        role="status"
        aria-label="Loading play and scores"
        aria-busy="true"
        className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8"
      >
        <div className="min-w-0">
          <Skeleton className="public-tab-title h-8 w-56 max-w-full" />
          <Skeleton className="public-tab-description mt-2 h-3.5 w-72 max-w-full" />
        </div>
        <div className="grid gap-8 sm:mt-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0">
            <Skeleton className="mb-2 h-5 w-28" />
            <Skeleton className="mb-4 h-3.5 w-48" />
            <LiveCourtSkeleton canScore={false} />
          </section>
          <aside className="min-w-0">
            <Skeleton className="h-5 w-24" />
            <Skeleton className="mt-2 h-3.5 w-44" />
            <div className="mt-3 divide-y divide-line border-y border-line">
              {Array.from({ length: 4 }, (_, index) => (
                <div key={index} className="public-session-row flex min-h-14 items-center gap-3">
                  <Skeleton className="h-3 w-5" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28 max-w-[45%]" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-7 h-24 w-full rounded-lg" />
          </aside>
        </div>
      </div>
    </main>
  );
}
