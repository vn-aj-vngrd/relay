import { GameResultsSkeleton } from "@/features/sessions/game-results-skeleton";
import { GamesCollectionHeader } from "@/features/sessions/games-collection-header";
import { GamesLoadingFilterRail } from "@/features/sessions/games-loading-filter-rail";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";

export default function GamesLoading() {
  return (
    <div>
      <GamesCollectionHeader title="Games" />
      <GamesSectionNav current="mine" />
      <GamesLoadingFilterRail />
      <section aria-label="Game results">
        <GameResultsSkeleton />
      </section>
    </div>
  );
}
