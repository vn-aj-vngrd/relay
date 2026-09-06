import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";
import { ButtonLink } from "@/components/ui/button";
import { GameResultsSkeleton } from "@/features/sessions/game-results-skeleton";
import { GameViewMenu } from "@/features/sessions/game-view-menu";
import { GamesLoadingFilterRail } from "@/features/sessions/games-loading-filter-rail";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";

export default function GamesLoading() {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="app-title">Games</h1>
        <div className="flex items-center gap-3">
          <div className="sm:hidden">
            <GameViewMenu />
          </div>
          <ButtonLink href="/games/new" className="hidden sm:inline-flex">
            <CalendarPlus aria-hidden size={17} /> Create game
          </ButtonLink>
        </div>
      </div>
      <GamesSectionNav current="mine" />
      <GamesLoadingFilterRail />
      <section aria-label="Game results">
        <GameResultsSkeleton />
      </section>
    </div>
  );
}
