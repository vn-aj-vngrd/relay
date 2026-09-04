import { Skeleton } from "@/components/shared/skeleton";

export function MemoriesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading session story"
      aria-busy="true"
      className="space-y-12"
    >
      <section>
        <Skeleton className="h-4 w-24" />
        <Skeleton className="mt-3 h-8 w-52" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-6 grid gap-7 border-y border-line py-7 md:grid-cols-[260px_1fr]">
          <Skeleton className="aspect-[9/16] w-full max-w-[260px] rounded-xl" />
          <div>
            <Skeleton className="h-6 w-20" />
            <div className="mt-3 flex gap-2 overflow-hidden">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton
                  key={index}
                  className="h-11 w-28 shrink-0 rounded-full"
                />
              ))}
            </div>
            <Skeleton className="mt-6 h-11 w-full" />
            <div className="mt-7 flex gap-2">
              <Skeleton className="h-10 w-36" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>
        </div>
      </section>
      <section>
        <Skeleton className="h-6 w-48" />
        <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        <div className="mt-5 grid grid-cols-2 gap-2 sm:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton
              key={index}
              className="aspect-square w-full rounded-[10px]"
            />
          ))}
        </div>
      </section>
    </div>
  );
}
