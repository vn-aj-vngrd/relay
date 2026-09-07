import { GamePageIntro } from "@/components/shared/game-page-intro";
import { MemoriesSkeleton } from "@/features/memories/memories-skeleton";

export default function GameStoryLoading() {
  return (
    <>
      <GamePageIntro title="Story" />
      <div className="mx-auto w-full max-w-6xl">
        <MemoriesSkeleton />
      </div>
    </>
  );
}
