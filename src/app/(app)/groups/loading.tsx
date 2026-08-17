import { PageHeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function GroupsLoading() {
  return <div role="status" aria-label="Loading groups" aria-busy="true"><PageHeaderSkeleton action /><div className="mt-10 flex items-center justify-between border-b border-line pb-4"><Skeleton className="h-4 w-16" /><div className="flex gap-1 rounded-lg bg-surface-strong p-1"><Skeleton className="h-9 w-9 rounded-lg" /><Skeleton className="h-9 w-9 rounded-lg" /></div></div><div className="mt-8"><Skeleton className="mb-3 h-5 w-24" /><RowsSkeleton rows={3} /></div></div>;
}
