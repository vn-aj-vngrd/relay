import { GamePageIntro } from "@/components/shared/game-page-intro";
import { PlaySkeleton } from "@/features/matches/play-skeleton";

export default function PlayLoading() {
  return (
    <>
      <GamePageIntro title="Play" />
      <PlaySkeleton label="Loading Play" />
    </>
  );
}
