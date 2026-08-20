import { MemoriesSkeleton } from "@/features/memories/memories-skeleton";

export default function PublicStoryLoading() {
  return (
    <main id="main-content" className="public-session-page min-h-screen bg-surface">
      <div className="public-session-panel public-session-content mx-auto max-w-6xl bg-surface px-4 py-8 sm:mt-8 sm:rounded-xl sm:border sm:border-line sm:px-8">
        <p className="text-sm font-semibold text-primary">After the last point</p>
        <h1 className="mt-1 app-title">Story</h1>
        <p className="mt-2 text-sm text-muted">Story-ready highlights, photos, reactions, and notes from the crew.</p>
        <div className="mt-7">
          <MemoriesSkeleton />
        </div>
      </div>
    </main>
  );
}
