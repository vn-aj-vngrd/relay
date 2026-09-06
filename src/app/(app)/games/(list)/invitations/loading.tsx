import { GameResultsSkeleton } from "@/features/sessions/game-results-skeleton";
import { GameViewMenu } from "@/features/sessions/game-view-menu";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { InvitationsLoadingFilters } from "@/features/sessions/invitations-loading-filters";

export default function InvitationsLoading() {
  return (
    <div>
      <div className="flex items-center justify-between gap-4">
        <h1 className="app-title">Invitations</h1>
        <div className="sm:hidden">
          <GameViewMenu />
        </div>
      </div>
      <GamesSectionNav current="invitations" />
      <InvitationsLoadingFilters />
      <GameResultsSkeleton invitations />
    </div>
  );
}
