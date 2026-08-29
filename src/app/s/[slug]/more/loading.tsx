import { Skeleton } from "@/components/shared/skeleton";

export default function PublicMoreLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
      aria-label="Loading game preferences"
      aria-busy="true"
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <Skeleton className="public-tab-title h-8 w-20" />
        <Skeleton className="public-tab-description mt-2 h-3.5 w-72 max-w-full" />
        <div className="sm:mt-8">
          <Skeleton className="h-4 w-24" />
          <div className="mt-2 divide-y divide-line border-y border-line">
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-2">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-40" />
              </div>
              <Skeleton className="h-9 w-36" />
            </div>
            <div className="flex min-h-14 flex-wrap items-center justify-between gap-4 py-3">
              <div className="space-y-2">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-9 w-40" />
            </div>
          </div>
        </div>
        <div className="mt-9 space-y-6">
          {Array.from({ length: 2 }, (_, index) => (
            <div key={index} className="flex gap-3">
              <Skeleton className="h-5 w-5 shrink-0" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-36" />
                <Skeleton className="h-3.5 w-full max-w-md" />
                <Skeleton className="h-3.5 w-3/4 max-w-sm" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
