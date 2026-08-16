import { PageHeaderSkeleton, RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function AppLoading() {
  return <div aria-label="Loading page" aria-busy="true"><PageHeaderSkeleton /><div className="mt-9"><Skeleton className="mb-3 h-4 w-24" /><RowsSkeleton rows={4} /></div></div>;
}
