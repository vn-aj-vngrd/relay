import { Skeleton } from "@/components/shared/skeleton";

export default function VenuesLoading() {
  return (
    <div aria-label="Loading court finder" role="status">
      <header className="flex items-center justify-between gap-3 sm:items-end">
        <div className="w-full max-w-2xl">
          <Skeleton className="h-9 w-44 max-w-full sm:w-72" />
          <Skeleton className="mt-3 hidden h-5 w-full max-w-xl sm:block" />
        </div>
        <Skeleton className="h-11 w-11 shrink-0 rounded-lg sm:h-9 sm:w-36" />
      </header>

      <div className="mt-4 border-b border-line pb-3 sm:mt-7 lg:border-y lg:py-4">
        <div className="grid grid-cols-[minmax(0,1fr)_44px] items-end gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-3">
          <Skeleton className="h-11 w-full rounded-lg" />
          <Skeleton className="h-11 w-11 rounded-lg lg:w-36" />
        </div>
        <div className="mt-3 flex gap-2 overflow-hidden">
          <Skeleton className="h-11 w-14 shrink-0 rounded-full" />
          <Skeleton className="h-11 w-20 shrink-0 rounded-full" />
          <Skeleton className="h-11 w-24 shrink-0 rounded-full" />
          <Skeleton className="h-11 w-28 shrink-0 rounded-full" />
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 py-2 xl:hidden">
        <div>
          <Skeleton className="h-4 w-14" />
          <Skeleton className="mt-1.5 h-3 w-16" />
        </div>
        <Skeleton className="h-12 w-36 rounded-lg" />
      </div>

      <div className="-mx-4 grid min-h-0 gap-3 sm:mx-0 sm:gap-4 xl:mt-4 xl:h-[calc(100dvh-350px)] xl:min-h-[640px] xl:grid-cols-[360px_minmax(0,1fr)]">
        <div className="flex min-h-0 flex-col xl:order-2">
          <Skeleton className="h-[58dvh] min-h-[400px] max-h-[520px] w-full rounded-none sm:h-[min(68dvh,620px)] sm:min-h-[460px] sm:max-h-none sm:rounded-xl xl:h-full xl:min-h-0" />
        </div>
        <div className="hidden h-[min(60dvh,520px)] min-h-[400px] overflow-hidden border-y border-line sm:h-[580px] sm:rounded-xl sm:border xl:order-1 xl:block xl:h-full">
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
