import { Skeleton } from "@/components/shared/skeleton";

export default function VenuesLoading() {
  return (
    <div aria-label="Loading court finder" role="status">
      <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="w-full max-w-2xl">
          <Skeleton className="h-9 w-72 max-w-full" />
          <Skeleton className="mt-3 h-5 w-full max-w-xl" />
          <Skeleton className="mt-2 h-5 w-4/5 max-w-lg" />
        </div>
        <Skeleton className="h-9 w-36 rounded-lg" />
      </header>

      <div className="mt-7 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="w-full max-w-2xl">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-2 h-11 w-full rounded-lg" />
        </div>
        <Skeleton className="h-10 w-44" />
      </div>

      <div className="mt-5 grid min-h-0 gap-4 xl:h-[calc(100dvh-360px)] xl:min-h-[620px] xl:grid-cols-[340px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col xl:order-2">
          <Skeleton className="h-[min(68dvh,620px)] min-h-[460px] w-full rounded-xl xl:h-full xl:min-h-0" />
          <Skeleton className="mt-2 h-4 w-full max-w-xl" />
        </div>
        <div className="h-[560px] overflow-hidden rounded-xl border border-line xl:order-1 xl:h-full">
          <div className="border-b border-line px-4 py-3">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-3 w-16" />
          </div>
          {[0, 1, 2, 3, 4].map((item) => (
            <div key={item} className="border-b border-line px-4 py-4">
              <Skeleton className="h-4 w-40" />
              <Skeleton className="mt-2 h-3 w-full" />
              <Skeleton className="mt-2 h-3 w-3/4" />
            </div>
          ))}
        </div>
      </div>
      <span className="sr-only">Loading court finder</span>
    </div>
  );
}
