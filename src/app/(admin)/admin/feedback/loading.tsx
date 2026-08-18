import { Skeleton } from "@/components/shared/skeleton";

export default function AdminFeedbackLoading() {
  return (
    <div role="status" aria-label="Loading feedback inbox">
      <Skeleton className="h-4 w-40" />
      <Skeleton className="mt-3 h-9 w-48" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <div className="mt-8 grid border-y border-line sm:grid-cols-5 sm:divide-x sm:divide-line">
        {Array.from({ length: 5 }, (_, index) => (
          <div key={index} className="py-4 sm:px-4 sm:first:pl-0">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="mt-3 h-7 w-8" />
          </div>
        ))}
      </div>
      <div className="my-6 grid gap-2 sm:grid-cols-[1fr_180px_180px_70px]">
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-10 w-full" />
      </div>
      <Skeleton className="h-6 w-24" />
      <div className="mt-2 space-y-1 border-y border-line py-1">
        {Array.from({ length: 4 }, (_, index) => (
          <Skeleton key={index} className="h-20 w-full" />
        ))}
      </div>
    </div>
  );
}
