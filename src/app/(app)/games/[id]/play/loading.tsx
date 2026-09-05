import { GamePageIntro } from "@/components/shared/game-page-intro";
import { PlaySkeleton } from "@/features/matches/play-skeleton";

export default function PlayLoading() {
  return (
    <>
      <GamePageIntro
        title="Play"
        description="Court assignments, scores, partner rotations, and who plays next."
      />
      <PlaySkeleton label="Loading Play" />
    </>
  );
}
