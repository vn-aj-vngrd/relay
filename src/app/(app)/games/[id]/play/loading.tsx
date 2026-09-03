import { GamePageIntro } from "@/components/shared/game-page-intro";
import { Skeleton } from "@/components/shared/skeleton";
import { LiveCourtSkeleton } from "@/features/matches/live-court-skeleton";

export default function PlayLoading() {
  return (
    <>
      <GamePageIntro
        title="Play"
        description="Court assignments, scores, partner rotations, and who plays next."
      />
      <div
        role="status"
        aria-label="Loading Play"
        aria-busy="true"
        className="grid gap-7 sm:pt-6 lg:grid-cols-[1fr_330px]"
      >
        <section className="min-w-0">
          <div className="mb-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="mt-2 h-3.5 w-52" />
          </div>
          <LiveCourtSkeleton />
        </section>
        <aside className="min-w-0">
          <Skeleton className="h-5 w-28" />
          <Skeleton className="mt-2 h-3.5 w-48" />
          <div className="mt-3 divide-y divide-line border-y border-line">
            {Array.from({ length: 4 }, (_, index) => (
              <div
                key={index}
                className="flex min-h-16 items-center gap-3 py-2"
              >
                <Skeleton className="h-4 w-5" />
                <Skeleton className="h-8 w-8 rounded-full" />
                <Skeleton className="h-4 w-32 max-w-[55%]" />
              </div>
            ))}
          </div>
          <Skeleton className="mt-7 h-24 w-full rounded-lg" />
        </aside>
      </div>
    </>
  );
}
