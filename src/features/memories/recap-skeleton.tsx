import { Skeleton } from "@/components/shared/skeleton";

export function RecapSkeleton() {
  return (
    <div role="status" aria-label="Loading session recap" aria-busy="true" className="space-y-10">
      <section className="rounded-xl bg-surface-strong px-5 py-8 sm:px-8 sm:py-10">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="mt-5 h-10 w-full max-w-xl" />
        <Skeleton className="mt-3 h-4 w-80 max-w-full" />
        <div className="mt-8 grid grid-cols-3 gap-5 border-y border-line py-5">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-14 w-full" />
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="h-6 w-44" />
        <Skeleton className="mt-2 h-4 w-80 max-w-full" />
        <div className="mt-4 grid gap-1 border-y border-line py-2 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-24 w-full" />
          ))}
        </div>
      </section>
      <section>
        <Skeleton className="h-6 w-40" />
        <div className="mt-4 space-y-1 border-y border-line py-2">
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-12 w-full" />
          ))}
        </div>
      </section>
      <section className="border-t border-line pt-6">
        <Skeleton className="h-6 w-64 max-w-full" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <Skeleton className="mt-4 h-9 w-32 rounded-lg" />
      </section>
    </div>
  );
}
