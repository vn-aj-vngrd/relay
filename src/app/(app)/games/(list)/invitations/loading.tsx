import { GameResultsSkeleton } from "@/features/sessions/game-results-skeleton";
import { GamesCollectionHeader } from "@/features/sessions/games-collection-header";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { InvitationsLoadingFilters } from "@/features/sessions/invitations-loading-filters";

export default function InvitationsLoading() {
  return (
    <div>
      <GamesCollectionHeader title="Invitations" />
      <GamesSectionNav current="invitations" />
      <InvitationsLoadingFilters />
      <GameResultsSkeleton invitations />
    </div>
  );
}
