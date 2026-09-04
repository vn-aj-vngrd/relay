import { GamePageIntro } from "@/components/shared/game-page-intro";
import { MemoriesSkeleton } from "@/features/memories/memories-skeleton";

export default function GameStoryLoading() {
  return (
    <>
      <GamePageIntro
        title="Story"
        description="Preparing the shareable game story and available photos."
      />
      <div className="mx-auto w-full max-w-6xl sm:pt-6">
        <MemoriesSkeleton />
      </div>
    </>
  );
}
