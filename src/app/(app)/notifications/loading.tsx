import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

export default function NotificationsLoading() {
  return <div className="mx-auto max-w-2xl" aria-label="Loading notifications" aria-busy="true"><Skeleton className="h-8 w-44" /><div className="mt-7"><RowsSkeleton rows={5} /></div></div>;
}
