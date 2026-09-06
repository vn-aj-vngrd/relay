"use client";

import { sessionDateKey } from "./format";
import { GameCollection } from "./game-collection";
import type { GameCollectionPage } from "./game-collection-types";
import type { GameLibraryFilters } from "./game-library-filters";

export { invitationHistoryLabel } from "./invitation-history-items";

export function InvitationsCollection({
  upcomingPage,
  pastPage,
  filters,
  hasHistory,
  todayKey = sessionDateKey(new Date()),
  initialMonth,
  initialDate,
  error,
}: {
  upcomingPage: GameCollectionPage;
  pastPage: GameCollectionPage;
  filters: GameLibraryFilters;
  hasHistory: boolean;
  todayKey?: string;
  initialMonth?: string;
  initialDate?: string;
  error?: string;
}) {
  return (
    <GameCollection
      upcomingPage={upcomingPage}
      pastPage={pastPage}
      filters={filters}
      hasInvitationHistory={hasHistory}
      todayKey={todayKey}
      initialMonth={initialMonth}
      initialDate={initialDate}
      filterError={error}
    />
  );
}
