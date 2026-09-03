import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";

export default function PlayersLoading() {
  return (
    <>
      <GamePageIntro
        title="Players"
        description="Manage who’s going, join requests, waitlist movement, and roster access."
      />
      <div
        role="status"
        aria-label="Loading players"
        aria-busy="true"
        className="mx-auto w-full max-w-6xl"
      >
        <section className="mb-9 border-y border-line py-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 gap-3">
              <Skeleton className="h-5 w-5 shrink-0" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-44 max-w-full" />
                <Skeleton className="mt-2 h-3.5 w-full max-w-md" />
              </div>
            </div>
            <Skeleton className="h-9 w-24" />
          </div>
          <div className="mt-4 grid gap-2 sm:grid-cols-[minmax(0,1fr)_220px_auto] sm:items-end">
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full" />
            <Skeleton className="h-11 w-full sm:w-20" />
          </div>
        </section>
        <section>
          <div className="flex items-end justify-between">
            <div>
              <Skeleton className="h-5 w-20" />
              <Skeleton className="mt-2 h-3.5 w-32" />
            </div>
            <Skeleton className="h-7 w-14" />
          </div>
          <div className="mt-4 divide-y divide-line border-y border-line">
            {Array.from({ length: 5 }, (_, index) => (
              <div key={index} className="flex min-h-16 items-center gap-3">
                <Skeleton className="h-8 w-8 rounded-full" />
                <div className="min-w-0 flex-1">
                  <Skeleton className="h-4 w-40 max-w-full" />
                  <Skeleton className="mt-1.5 h-3 w-24 max-w-full" />
                </div>
                <Skeleton className="h-9 w-9" />
              </div>
            ))}
          </div>
        </section>
        <section className="mt-9">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="mt-3 h-14 w-full" />
        </section>
      </div>
    </>
  );
}
