import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function SessionLoading() {
  return <div aria-label="Loading session" aria-busy="true"><div className="space-y-2"><Skeleton className="h-3 w-28" /><Skeleton className="h-8 w-72 max-w-[80vw]" /><Skeleton className="h-4 w-24" /></div><Skeleton className="mt-6 h-10 w-full max-w-md" /><div className="mt-8 grid gap-10 lg:grid-cols-[1fr_360px]"><div><Skeleton className="mb-4 h-5 w-20" /><RowsSkeleton rows={3} /></div><div><Skeleton className="mb-4 h-5 w-24" /><RowsSkeleton rows={4} /></div></div></div>;
}
