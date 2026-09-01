import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function GamesLoading() {
  return (
    <div role="status" aria-label="Loading games" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-9 shrink-0 sm:hidden" />
        <Skeleton className="hidden h-9 w-32 rounded-lg sm:block" />
      </div>
      <div className="mt-4 border-b border-line pb-3 sm:mt-10 sm:pb-4">
        <div className="flex min-w-0 items-center gap-4">
          <Skeleton className="hidden h-4 w-16 shrink-0 sm:block" />
          <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
            <Skeleton className="h-11 w-24 shrink-0 rounded-full sm:h-9" />
            <Skeleton className="h-11 w-12 shrink-0 rounded-full sm:h-9" />
            <Skeleton className="h-11 w-14 shrink-0 rounded-full sm:h-9" />
          </div>
          <Skeleton className="hidden h-11 w-28 shrink-0 rounded-lg sm:block" />
        </div>
      </div>
      <div className="mt-6 sm:mt-8">
        <Skeleton className="mb-3 h-5 w-24" />
        <RowsSkeleton rows={3} />
      </div>
    </div>
  );
}
