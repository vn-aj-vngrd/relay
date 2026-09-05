import { Skeleton } from "@/components/shared/skeleton";

export function MemoriesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading session story"
      aria-busy="true"
      className="grid items-start gap-5 md:grid-cols-[260px_minmax(0,560px)] md:gap-7"
    >
      <div className="mx-auto w-full max-w-[280px] md:max-w-none">
        <div className="mb-3 grid grid-cols-3 gap-1">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-1 w-full rounded-full" />
          ))}
        </div>
        <Skeleton className="aspect-[9/16] w-full rounded-xl" />
        <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="mx-auto h-3.5 w-28" />
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
      </div>

      <div className="min-w-0">
        <Skeleton className="h-4 w-12" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="mt-6 flex min-h-14 items-center gap-3 border-y border-line py-2">
          <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
        <div className="mt-6 flex flex-col gap-2 sm:flex-row">
          <Skeleton className="h-9 w-full rounded-lg sm:w-36" />
          <Skeleton className="h-9 w-full rounded-lg sm:w-28" />
        </div>
      </div>
    </div>
  );
}
