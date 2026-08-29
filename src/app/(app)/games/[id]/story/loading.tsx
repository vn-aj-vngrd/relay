import { GamePageIntro } from "@/components/shared/game-page-intro";
import { MemoriesSkeleton } from "@/features/memories/memories-skeleton";

export default function GameStoryLoading() {
  return (
    <>
      <GamePageIntro title="Story" description="Story-ready highlights, photos, reactions, and notes from the crew." />
      <div className="mx-auto w-full max-w-6xl sm:pt-6">
        <MemoriesSkeleton />
      </div>
    </>
  );
}
