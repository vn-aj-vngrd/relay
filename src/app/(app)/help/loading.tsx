import { PageHeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function HelpLoading() {
  return <div role="status" className="mx-auto max-w-4xl" aria-label="Loading Help Center" aria-busy="true"><PageHeaderSkeleton /><Skeleton className="mt-5 h-10 w-full max-w-xl" /><div className="mt-10 grid gap-10 lg:grid-cols-[180px_1fr]"><div className="hidden space-y-3 lg:block"><Skeleton className="h-4 w-28" /><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-24" /></div><div><Skeleton className="mb-3 h-5 w-36" /><RowsSkeleton rows={5} /></div></div></div>;
}
