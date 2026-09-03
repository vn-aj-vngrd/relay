import { Skeleton } from "@/components/shared/skeleton";

function CourtSkeleton() {
  return (
    <div className="overflow-hidden rounded-xl bg-court">
      <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
        <div className="space-y-2">
          <Skeleton className="h-3 w-16 bg-white/15" />
          <Skeleton className="h-3 w-24 bg-white/10" />
        </div>
        <Skeleton className="h-4 w-12 bg-white/15" />
      </div>
      <div className="grid grid-cols-[1fr_auto_1fr] items-stretch">
        {[0, 1].map((side) => (
          <div
            key={side}
            className={
              side === 0
                ? "col-start-1 row-start-1"
                : "col-start-3 row-start-1 border-l border-white/10"
            }
          >
            <div className="px-3 pb-3 pt-5 text-center sm:px-5">
              <Skeleton className="mx-auto h-4 w-24 max-w-full bg-white/15" />
              <Skeleton className="mx-auto mt-5 h-16 w-16 bg-white/15 sm:h-20 sm:w-20" />
            </div>
            <div className="grid grid-cols-2 border-t border-white/10">
              <Skeleton className="h-16 rounded-none border-r border-white/10 bg-white/10" />
              <Skeleton className="h-16 rounded-none bg-white/10" />
            </div>
          </div>
        ))}
        <span className="col-start-2 row-start-1 self-center px-2 text-white/30">
          –
        </span>
      </div>
    </div>
  );
}

export default function PublicCourtsLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      aria-label="Loading courts and scores"
      aria-busy="true"
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 py-8 sm:px-6">
        <div className="flex min-w-0 items-end justify-between gap-4">
          <div className="min-w-0">
            <Skeleton className="h-4 w-40 max-w-full" />
            <Skeleton className="mt-2 h-8 w-56 max-w-full" />
            <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
          </div>
          <Skeleton className="h-11 w-20 shrink-0" />
        </div>
        <div className="mt-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_300px]">
          <section className="min-w-0">
            <Skeleton className="mb-4 h-5 w-28" />
            <CourtSkeleton />
          </section>
          <aside className="min-w-0">
            <Skeleton className="h-5 w-24" />
            <div className="mt-3 divide-y divide-line border-y border-line">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="public-session-row flex min-h-14 items-center gap-3"
                >
                  <Skeleton className="h-3 w-5" />
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 w-28 max-w-[45%]" />
                </div>
              ))}
            </div>
            <Skeleton className="mt-9 h-5 w-36" />
            <div className="mt-3 border-y border-line">
              <div className="flex justify-between py-2">
                <Skeleton className="h-3 w-20" />
                <Skeleton className="h-3 w-20" />
              </div>
              {Array.from({ length: 3 }, (_, index) => (
                <div
                  key={index}
                  className="public-session-row flex items-center justify-between border-t border-line"
                >
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-16" />
                </div>
              ))}
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
