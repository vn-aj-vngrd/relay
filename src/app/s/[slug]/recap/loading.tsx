import { Skeleton } from "@/components/shared/skeleton";
import { RecapSkeleton } from "@/features/memories/recap-skeleton";

export default function PublicRecapLoading() {
  return (
    <main className="public-session-page min-h-screen bg-surface">
      <div className="public-session-panel public-session-content mx-auto max-w-6xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
        <Skeleton className="h-4 w-36" />
        <div className="mt-3">
          <Skeleton className="h-9 w-28" />
          <Skeleton className="mt-3 h-4 w-full max-w-xl" />
        </div>
        <div className="mt-7">
          <RecapSkeleton />
        </div>
      </div>
    </main>
  );
}
