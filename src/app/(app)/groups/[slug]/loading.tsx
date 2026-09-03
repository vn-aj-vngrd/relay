import { Skeleton } from "@/components/shared/skeleton";

export default function GroupLoading() {
  return (
    <div
      role="status"
      className="mx-auto max-w-6xl"
      aria-label="Loading group"
      aria-busy="true"
    >
      <header
        data-testid="group-detail-skeleton-header"
        className="flex flex-col gap-5 border-b border-line pb-7 sm:flex-row sm:items-end sm:justify-between"
      >
        <div className="flex min-w-0 items-start gap-4 sm:items-center">
          <Skeleton className="h-20 w-20 shrink-0 rounded-full sm:h-24 sm:w-24" />
          <div className="min-w-0">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="mt-2 h-9 w-56 max-w-full" />
            <Skeleton className="mt-3 h-4 w-80 max-w-full" />
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Skeleton className="h-9 w-28 rounded-lg" />
          <Skeleton className="h-9 w-28 rounded-lg" />
        </div>
      </header>

      <div className="grid gap-10 py-8 lg:grid-cols-[minmax(0,1fr)_280px]">
        <div className="space-y-10">
          <section aria-label="Loading upcoming games">
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3.5 w-48" />
            <div className="mt-3 divide-y divide-line border-y border-line">
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="flex min-h-20 items-center gap-3 py-4 sm:px-2"
                >
                  <Skeleton className="h-8 w-1 rounded-full" />
                  <div className="min-w-0 flex-1">
                    <Skeleton className="h-4 w-40 max-w-full" />
                    <Skeleton className="mt-2 h-3.5 w-72 max-w-full" />
                  </div>
                  <Skeleton className="h-4 w-4" />
                </div>
              ))}
            </div>
          </section>

          <section
            data-testid="group-detail-skeleton-memories"
            aria-label="Loading shared memories"
          >
            <Skeleton className="h-5 w-36" />
            <Skeleton className="mt-2 h-3.5 w-64 max-w-full" />
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              {Array.from({ length: 2 }, (_, index) => (
                <div
                  key={index}
                  className="overflow-hidden rounded-xl border border-line bg-surface"
                >
                  <Skeleton className="aspect-[16/9] w-full rounded-none" />
                  <div className="p-4">
                    <Skeleton className="h-4 w-36 max-w-full" />
                    <Skeleton className="mt-2 h-3.5 w-24" />
                    <Skeleton className="mt-4 h-4 w-28" />
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="self-start lg:sticky lg:top-6">
          <section aria-label="Loading group members">
            <div className="flex items-end justify-between gap-4">
              <div>
                <Skeleton className="h-5 w-24" />
                <Skeleton className="mt-2 h-3.5 w-28" />
              </div>
              <div className="flex -space-x-2">
                {Array.from({ length: 3 }, (_, index) => (
                  <Skeleton
                    key={index}
                    className="h-8 w-8 rounded-full border-2 border-surface"
                  />
                ))}
              </div>
            </div>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {Array.from({ length: 4 }, (_, index) => (
                <div
                  key={index}
                  className="flex min-h-14 items-center gap-3 py-2"
                >
                  <Skeleton className="h-8 w-8 rounded-full" />
                  <Skeleton className="h-4 min-w-0 flex-1" />
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
            <div className="mt-5">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="mt-2 h-3.5 w-full" />
              <div className="mt-4 flex gap-2">
                <Skeleton className="h-10 min-w-0 flex-1 rounded-lg" />
                <Skeleton className="h-10 w-20 rounded-lg" />
              </div>
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}
