import { PageHeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function GamesLoading() {
  return (
    <div role="status" aria-label="Loading games" aria-busy="true">
      <PageHeaderSkeleton action />
      <div className="mt-10 flex items-center justify-between border-b border-line pb-4">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-10 w-32" />
      </div>
      <div className="mt-8">
        <Skeleton className="mb-3 h-5 w-24" />
        <RowsSkeleton rows={3} />
      </div>
    </div>
  );
}
