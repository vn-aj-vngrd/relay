import { GamePageIntro } from "@/components/shared/game-page-intro";
import { RecapSkeleton } from "@/features/memories/recap-skeleton";

export default function GameRecapLoading() {
  return (
    <>
      <GamePageIntro title="Recap" description="The scores, pairings, photos, and moments your crew made together." />
      <div className="mx-auto w-full max-w-6xl pt-6">
        <RecapSkeleton />
      </div>
    </>
  );
}
