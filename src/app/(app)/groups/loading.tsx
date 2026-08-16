import { PageHeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function GroupsLoading() {
  return <div className="max-w-4xl" aria-label="Loading groups" aria-busy="true"><PageHeaderSkeleton /><div className="mt-10 border-y border-line py-8"><Skeleton className="h-6 w-56" /><Skeleton className="mt-3 h-4 w-full max-w-md" /><div className="mt-7"><RowsSkeleton rows={3} /></div></div></div>;
}
