"use client";

import { useSearchParams } from "next/navigation";
import { GameLibraryControls } from "./game-library-controls";
import {
  defaultGameLibraryFilters,
  parseGameLibraryFilters,
} from "./game-library-filters";

export function GamesLoadingFilterRail() {
  const params = useSearchParams();
  const parsed = parseGameLibraryFilters(params);
  return (
    <GameLibraryControls
      filters={parsed.success ? parsed.data : defaultGameLibraryFilters}
      loadingOptions
    />
  );
}
