import { Skeleton } from "@/components/shared/skeleton";

export default function GroupsLoading() {
  return (
    <div role="status" aria-label="Loading groups" aria-busy="true">
      <header className="flex items-center justify-between gap-4">
        <Skeleton className="h-7 w-28" />
        <Skeleton className="h-9 w-9 rounded-lg sm:hidden" />
        <Skeleton className="hidden h-9 w-28 rounded-lg sm:block" />
      </header>

      <div className="mt-5 sm:mt-10">
        <div className="mb-8 hidden items-center justify-between gap-4 border-b border-line pb-4 sm:flex">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-11 w-20 rounded-lg" />
        </div>
        <Skeleton className="mb-3 h-5 w-24" />
        <div className="divide-y divide-line border-y border-line">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="flex min-h-[4.5rem] items-center gap-3 py-3.5 sm:min-h-20 sm:gap-4 sm:px-3 sm:py-4"
            >
              <Skeleton className="h-10 w-10 shrink-0 rounded-full sm:h-11 sm:w-11" />
              <div className="min-w-0 flex-1">
                <Skeleton className="h-4 w-40 max-w-[70%]" />
                <Skeleton className="mt-2 h-3.5 w-64 max-w-[85%]" />
              </div>
              <Skeleton className="hidden h-3 w-12 sm:block" />
              <Skeleton className="h-4 w-4 shrink-0" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
