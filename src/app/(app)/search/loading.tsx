import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function SearchLoading() {
  return <div className="mx-auto max-w-3xl" aria-label="Loading search" aria-busy="true"><Skeleton className="h-8 w-40" /><Skeleton className="mt-6 h-12 w-full" /><div className="mt-9"><RowsSkeleton rows={4} /></div></div>;
}
