import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function GamesLoading() {
  return (
    <div role="status" aria-label="Loading games" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-9 w-9 shrink-0 sm:hidden" />
      </div>
      <div className="mt-4 pb-3 sm:mt-5">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex min-w-0 flex-1 gap-2 overflow-hidden">
            <Skeleton className="h-11 w-24 shrink-0 rounded-full sm:h-9" />
            <Skeleton className="h-11 w-12 shrink-0 rounded-full sm:h-9" />
            <Skeleton className="h-11 w-14 shrink-0 rounded-full sm:h-9" />
          </div>
          <Skeleton className="hidden h-9 w-[100px] shrink-0 rounded-lg sm:block" />
          <Skeleton className="hidden h-9 w-32 shrink-0 rounded-lg sm:block" />
        </div>
      </div>
      <div className="mt-6">
        <Skeleton className="mb-3 h-5 w-24" />
        <RowsSkeleton rows={3} />
      </div>
    </div>
  );
}
