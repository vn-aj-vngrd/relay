"use client";

import { useSearchParams } from "next/navigation";
import { openGamesFilterSchema } from "./open-games";
import { OpenGamesFilters } from "./open-games-filters";

export function OpenGamesLoadingFilters() {
  const params = useSearchParams();
  const parsed = openGamesFilterSchema.safeParse(
    Object.fromEntries(params.entries())
  );
  return (
    <OpenGamesFilters
      filters={parsed.success ? parsed.data : openGamesFilterSchema.parse({})}
    />
  );
}
