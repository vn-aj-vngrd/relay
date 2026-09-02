import { Skeleton } from "@/components/shared/skeleton";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import type { OpenGamesFilters as OpenGamesFilterValues } from "@/features/sessions/open-games";
import { OpenGamesFilters } from "@/features/sessions/open-games-filters";

const defaultFilters: OpenGamesFilterValues = { date: "any", location: "", available: false };

function OpenGameRowSkeleton() {
  return (
    <div className="px-2 py-4 sm:grid sm:min-h-24 sm:grid-cols-[minmax(0,1.4fr)_minmax(9rem,1fr)_auto] sm:items-center sm:gap-6 sm:px-3">
      <div className="flex items-center gap-2">
        <Skeleton className="h-7 w-1 shrink-0 rounded-full" />
        <div className="min-w-0 flex-1 space-y-2">
          <Skeleton className="h-4 w-44 max-w-[70%]" />
          <Skeleton className="h-3 w-28 max-w-[50%]" />
        </div>
      </div>
      <div className="mt-3 space-y-2 sm:mt-0">
        <Skeleton className="h-3.5 w-44 max-w-full" />
        <Skeleton className="h-3.5 w-36 max-w-full" />
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-line pt-3 sm:mt-0 sm:block sm:border-0 sm:pt-0">
        <div className="space-y-2 sm:ml-auto sm:w-28">
          <Skeleton className="h-3.5 w-16 sm:ml-auto" />
          <Skeleton className="h-3 w-28" />
        </div>
        <Skeleton className="h-4 w-4 sm:hidden" />
      </div>
    </div>
  );
}

export default function OpenGamesLoading() {
  return (
    <div>
      <h1 className="app-title">Games</h1>
      <GamesSectionNav current="open" />
      <OpenGamesFilters filters={defaultFilters} />
      <div role="status" aria-label="Loading open games" aria-busy="true" className="mt-6">
        <div className="divide-y divide-line border-t border-line">
          {Array.from({ length: 4 }, (_, index) => (
            <OpenGameRowSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}
