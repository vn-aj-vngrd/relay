import { Skeleton } from "@/components/shared/skeleton";

import styles from "./story-workspace.module.css";

export function MemoriesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading session story"
      aria-busy="true"
      className={styles.workspace}
    >
      <div className={styles.carousel}>
        <div className="mb-3 grid grid-cols-3 gap-1">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-1 w-full rounded-full" />
          ))}
        </div>
        <div className={styles.portrait}>
          <Skeleton className="aspect-[9/16] w-full rounded-xl" />
        </div>
        <div className="mt-3 grid grid-cols-[44px_1fr_44px] items-center gap-2">
          <Skeleton className="h-11 w-11 rounded-lg" />
          <Skeleton className="mx-auto h-3.5 w-28" />
          <Skeleton className="h-11 w-11 rounded-lg" />
        </div>
      </div>

      <div className="min-w-0">
        <Skeleton className="h-4 w-12" />
        <div className="mt-3 flex gap-2 overflow-hidden">
          {Array.from({ length: 3 }, (_, index) => (
            <Skeleton key={index} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>
        <div className="mt-4 flex flex-wrap gap-2">
          <Skeleton className="h-10 min-w-0 flex-1 rounded-lg md:w-36 md:flex-none" />
          <Skeleton className="h-10 min-w-0 flex-1 rounded-lg md:w-28 md:flex-none" />
        </div>
        <div className="mt-4 flex min-h-14 items-center gap-3 border-y border-line py-2">
          <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
          <div className="min-w-0 flex-1">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="mt-2 h-3 w-24" />
          </div>
          <Skeleton className="h-4 w-4" />
        </div>
      </div>
    </div>
  );
}
