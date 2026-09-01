import { RowsSkeleton } from "@/components/shared/skeleton";
import { GameViewMenu } from "@/features/sessions/game-collection";
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
      <section className="mt-8" aria-labelledby="loading-upcoming-games">
        <h2 id="loading-upcoming-games" className="mb-3 text-lg font-bold">
          Upcoming
        </h2>
        <RowsSkeleton rows={3} />
      </section>
    </div>
  );
}
