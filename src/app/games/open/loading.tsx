import Link from "next/link";
import { getCurrentUser } from "@/features/auth/session";
import { GameResultsSkeleton } from "@/features/sessions/game-results-skeleton";
import { GamesCollectionHeader } from "@/features/sessions/games-collection-header";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { OpenGamesLoadingFilters } from "@/features/sessions/open-games-loading-filters";

export default async function OpenGamesLoading() {
  const user = await getCurrentUser();
  return (
    <div>
      <GamesCollectionHeader title="Open games" />
      {user ? (
        <GamesSectionNav current="open" />
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-sm">
          <p>
            Open a game to join by name. Sign in to keep it in your Relay
            schedule.
          </p>
          <Link
            href="/login?next=%2Fgames%2Fopen"
            className="font-semibold text-primary"
          >
            Log in to keep your games
          </Link>
        </div>
      )}
      <OpenGamesLoadingFilters />
      <div className="mt-6">
        <GameResultsSkeleton discovery />
      </div>
    </div>
  );
}
