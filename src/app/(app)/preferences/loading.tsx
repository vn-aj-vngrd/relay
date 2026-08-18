import { PageHeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function PreferencesLoading() {
  return <div role="status" className="mx-auto w-full max-w-4xl" aria-label="Loading preferences" aria-busy="true"><PageHeaderSkeleton /><div className="mt-9 space-y-8"><div><Skeleton className="mb-3 h-4 w-24" /><RowsSkeleton rows={2} /></div><div><Skeleton className="mb-3 h-4 w-16" /><RowsSkeleton rows={2} /></div></div></div>;
}
