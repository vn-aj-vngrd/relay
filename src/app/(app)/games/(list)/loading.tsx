import { CalendarPlus } from "@phosphor-icons/react/dist/ssr";

import { RowsSkeleton } from "@/components/shared/skeleton";
import { ButtonLink } from "@/components/ui/button";
import {
  GameDesktopViewControls,
  GameViewMenu,
} from "@/features/sessions/game-view-menu";
import { GamesLoadingFilterRail } from "@/features/sessions/games-loading-filter-rail";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";

export default function GamesLoading() {
  return (
    <div role="status" aria-label="Loading games" aria-busy="true">
      <div className="flex items-center justify-between gap-4">
        <h1 className="app-title">Games</h1>
        <div className="sm:hidden">
          <GameViewMenu />
        </div>
      </div>
      <GamesSectionNav current="mine" />
      <div className="mt-2 sm:mt-3">
        <div className="mb-6 pb-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="min-w-0 flex-1">
              <GamesLoadingFilterRail />
            </div>
            <span className="hidden shrink-0 sm:block">
              <GameDesktopViewControls />
            </span>
            <span className="hidden shrink-0 sm:block">
              <ButtonLink href="/games/new">
                <CalendarPlus aria-hidden size={17} />
                Create game
              </ButtonLink>
            </span>
          </div>
        </div>
      </div>
      <section aria-labelledby="loading-upcoming-games">
        <h2 id="loading-upcoming-games" className="mb-3 text-lg font-bold">
          Upcoming
        </h2>
        <RowsSkeleton rows={3} />
      </section>
    </div>
  );
}
