import { Skeleton } from "@/components/shared/skeleton";

export default function PublicPlayersLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
    >
      <article
        role="status"
        aria-label="Loading players"
        aria-busy="true"
        className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8"
      >
        <div className="flex items-end justify-between gap-4">
          <div>
            <Skeleton className="public-tab-title h-8 w-28" />
            <Skeleton className="mt-2 h-3.5 w-36" />
          </div>
          <Skeleton className="h-7 w-16" />
        </div>
        <div className="mt-6 divide-y divide-line border-y border-line">
          {Array.from({ length: 5 }, (_, index) => (
            <div
              key={index}
              className="public-session-row flex min-h-16 items-center gap-3 py-2"
            >
              <Skeleton className="h-8 w-8 rounded-full" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 max-w-full" />
                <Skeleton className="mt-1.5 h-3 w-24 max-w-full" />
              </div>
              <Skeleton className="h-3 w-12" />
            </div>
          ))}
        </div>
        <div className="mt-10">
          <Skeleton className="h-5 w-20" />
          <div className="mt-3 divide-y divide-line border-y border-line">
            {Array.from({ length: 2 }, (_, index) => (
              <div
                key={index}
                className="public-session-row flex min-h-14 items-center gap-3"
              >
                <Skeleton className="h-3 w-5" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))}
          </div>
        </div>
      </article>
    </main>
  );
}
