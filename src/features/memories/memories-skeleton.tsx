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
      <span className="sr-only">Loading your story editor…</span>
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
              Add a photo. Pick a look. Share your game.
            </p>
            <Skeleton className="mt-3 h-9 w-36 rounded-lg" />
            <Skeleton className="mt-3 h-5 w-24" />
            <Skeleton className="mt-2 h-12 w-full rounded-lg" />
            <div className="mt-2 flex gap-2 overflow-hidden">
              <Skeleton className="h-9 w-44 shrink-0 rounded-full" />
              <Skeleton className="h-9 w-36 shrink-0 rounded-full" />
            </div>
          </div>
          <div className="mt-3 flex gap-2 overflow-hidden">
            {Array.from({ length: 4 }, (_, index) => (
              <Skeleton
                key={index}
                className="h-9 w-24 shrink-0 rounded-full"
              />
            ))}
          </div>
          <Skeleton className="mt-2 h-9 w-24 rounded-lg" />

          <div className="mt-6 min-w-0">
            <p className="text-sm font-semibold">Story theme</p>
            <div className={`${styles.themeRail} flex gap-2 overflow-hidden`}>
              {Array.from({ length: 5 }, (_, index) => (
                <div
                  key={index}
                  className={`${styles.themeOption} border border-line`}
                >
                  <Skeleton className={styles.themeThumbnail} />
                  <Skeleton className="mx-auto h-3.5 w-14" />
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 flex min-h-14 items-center gap-3 border-y border-line py-2">
            <Skeleton className="h-5 w-5 shrink-0 rounded-md" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-bold">Customize story</p>
              <Skeleton className="mt-1 h-3 w-32" />
            </div>
            <Skeleton className="h-4 w-4" />
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
