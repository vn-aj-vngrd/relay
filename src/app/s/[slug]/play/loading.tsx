import { Skeleton } from "@/components/shared/skeleton";
import { PlaySkeleton } from "@/features/matches/play-skeleton";

export default function PublicPlayLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-full bg-surface pb-6 sm:pb-8"
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <div className="min-w-0">
          <Skeleton className="public-tab-title h-8 w-24" />
          <Skeleton className="public-tab-description mt-2 h-3.5 w-72 max-w-full" />
        </div>
        <div className="mt-5 sm:mt-7">
          <PlaySkeleton canScore={false} label="Loading play and scores" />
        </div>
      </div>
    </main>
  );
}
