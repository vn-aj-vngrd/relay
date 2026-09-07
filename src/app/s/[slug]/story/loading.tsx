import { MemoriesSkeleton } from "@/features/memories/memories-skeleton";

export default function PublicStoryLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-screen bg-surface"
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <h1 className="sr-only">Story</h1>
        <div>
          <MemoriesSkeleton />
        </div>
      </div>
    </main>
  );
}
