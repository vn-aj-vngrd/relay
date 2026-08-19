import { Skeleton } from "@/components/shared/skeleton";

export default function SuggestVenueLoading() {
  return (
    <div role="status" aria-label="Loading court submission form">
      <Skeleton className="h-9 w-72 max-w-full" />
      <Skeleton className="mt-3 h-5 w-full max-w-xl" />
      <div className="mt-8 max-w-2xl space-y-6 border-t border-line pt-7">
        {[0, 1, 2, 3].map((item) => (
          <div key={item}>
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-11 w-full rounded-lg" />
          </div>
        ))}
      </div>
      <span className="sr-only">Loading court submission form</span>
    </div>
  );
}
