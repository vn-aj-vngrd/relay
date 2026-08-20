import { Skeleton } from "@/components/shared/skeleton";

export default function AdminCourtLoading() {
  return (
    <div role="status" aria-label="Loading court record">
      <Skeleton className="h-4 w-44" />
      <Skeleton className="mt-3 h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-4 w-48" />
      <div className="mt-8 grid max-w-3xl gap-5 sm:grid-cols-2">
        {[0, 1, 2, 3, 4, 5].map((item) => (
          <div key={item} className={item < 2 ? "sm:col-span-2" : ""}>
            <Skeleton className="h-4 w-28" />
            <Skeleton className="mt-2 h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading court record</span>
    </div>
  );
}
