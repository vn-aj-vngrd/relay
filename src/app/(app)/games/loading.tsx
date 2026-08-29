import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function GamesLoading() {
  return (
    <div role="status" aria-label="Loading games" aria-busy="true">
      <div className="flex items-center justify-between gap-4 sm:block">
        <Skeleton className="h-7 w-24" />
        <Skeleton className="h-11 w-11 shrink-0 sm:hidden" />
        <Skeleton className="mt-2.5 hidden h-4 w-72 sm:block" />
      </div>
      <div className="mt-4 border-b border-line pb-3 sm:mt-10 sm:pb-4">
        <div className="flex gap-2 sm:hidden">
          <Skeleton className="h-11 w-24 rounded-full" />
          <Skeleton className="h-11 w-12 rounded-full" />
          <Skeleton className="h-11 w-14 rounded-full" />
        </div>
        <div className="hidden items-center justify-between sm:flex">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="mt-3 hidden gap-2 sm:flex">
          <Skeleton className="h-9 w-24 rounded-full" />
          <Skeleton className="h-9 w-12 rounded-full" />
          <Skeleton className="h-9 w-14 rounded-full" />
        </div>
      </div>
      <div className="mt-6 sm:mt-8">
        <Skeleton className="mb-3 h-5 w-24" />
        <RowsSkeleton rows={3} />
      </div>
    </div>
  );
}
