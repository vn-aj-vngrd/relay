import { LoadingState } from "@/components/shared/content-state";
import { Skeleton } from "@/components/shared/skeleton";

import styles from "./story-workspace.module.css";

export function MemoriesSkeleton() {
  return (
    <div
      role="status"
      aria-label="Loading session story"
      aria-busy="true"
      className={`${styles.storySurface} flex flex-col gap-4 sm:gap-6`}
    >
      <LoadingState
        compact
        announce={false}
        label="Loading session story"
        className="col-span-full"
      />

      {/* The available views depend on the game's phase and album. */}
      <div className="h-9" aria-hidden />
      <div className={styles.workspace}>
        <div className={styles.carousel}>
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
          <div className="mb-5">
            <h2 className="text-lg font-bold">Make it your memory</h2>
            <p className="mt-1 text-sm text-muted">
              Pick your moments. Make them yours.
            </p>
            <div
              className="mt-4 flex gap-2 text-sm font-semibold text-muted"
              aria-hidden
            >
              <span className="px-3 py-2">Photos</span>
              <span className="px-3 py-2">Layout</span>
              <span className="px-3 py-2">Look</span>
              <span className="px-3 py-2">Details</span>
            </div>
            <p className="mt-4 text-sm font-semibold">Choose up to 4 moments</p>
            <Skeleton className="mt-3 h-9 w-28 rounded-lg" />
            <div className="mt-3 grid grid-cols-4 gap-2">
              {Array.from({ length: 4 }, (_, index) => (
                <Skeleton key={index} className="aspect-square rounded-lg" />
              ))}
            </div>
          </div>
          <div className={styles.actions}>
            <Skeleton className="h-11 min-w-0 flex-1 rounded-lg" />
            <Skeleton className="h-11 min-w-0 flex-1 rounded-lg" />
          </div>
        </div>
      </div>
    </div>
  );
}
