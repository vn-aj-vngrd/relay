import { PlaySkeleton } from "@/features/matches/play-skeleton";

export default function PublicPlayLoading() {
  return (
    <main
      id="main-content"
      className="public-session-page min-h-full bg-surface pb-6 sm:pb-8"
    >
      <div className="public-session-content mx-auto w-full max-w-6xl bg-surface px-4 pb-8 pt-4 sm:px-6 sm:py-8">
        <h1 className="sr-only">Play</h1>
        <PlaySkeleton canScore={false} label="Loading play and scores" />
      </div>
    </main>
  );
}
