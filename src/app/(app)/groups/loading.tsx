import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function GroupsLoading() {
  return (
    <div role="status" aria-label="Loading groups" aria-busy="true">
      <div className="flex items-center justify-between gap-4 sm:items-end">
        <div className="space-y-2.5">
          <Skeleton className="h-7 w-28" />
          <Skeleton className="hidden h-4 w-72 sm:block" />
        </div>
        <Skeleton className="h-11 w-11 sm:hidden" />
        <Skeleton className="hidden h-9 w-28 sm:block" />
      </div>
      <div className="mt-10 hidden items-center justify-between border-b border-line pb-4 sm:flex">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="mt-5 sm:mt-8">
        <Skeleton className="mb-3 h-5 w-24" />
        <RowsSkeleton rows={3} />
      </div>
    </div>
  );
}
