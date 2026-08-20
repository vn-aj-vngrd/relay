import { Skeleton } from "@/components/shared/skeleton";

export default function AdminCourtsLoading() {
  return (
    <div role="status" aria-label="Loading court operations">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-3 h-9 w-40" />
      <Skeleton className="mt-3 h-4 w-full max-w-2xl" />
      <div className="mt-8 flex max-w-3xl gap-2">
        <Skeleton className="h-10 flex-1 rounded-lg" />
        <Skeleton className="h-10 w-40 rounded-lg" />
        <Skeleton className="h-10 w-20 rounded-lg" />
      </div>
      <div className="mt-5 border-y border-line">
        {[0, 1, 2, 3, 4].map((item) => (
          <div key={item} className="flex items-center gap-5 border-b border-line px-3 py-4 last:border-b-0">
            <div className="flex-1">
              <Skeleton className="h-4 w-48" />
              <Skeleton className="mt-2 h-3 w-72 max-w-full" />
            </div>
            <Skeleton className="h-6 w-20 rounded-md" />
            <Skeleton className="h-4 w-10" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading court operations</span>
    </div>
  );
}
