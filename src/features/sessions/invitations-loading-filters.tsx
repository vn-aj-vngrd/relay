"use client";

import { useSearchParams } from "next/navigation";
import { GameLibraryControls } from "./game-library-controls";
import { gameLibraryFilterSchema } from "./game-library-filters";

export function InvitationsLoadingFilters() {
  const params = useSearchParams();
  const defaults = {
    collection: "invitations",
    response: "invited",
    cancelled: "true",
  };
  const parsed = gameLibraryFilterSchema.safeParse({
    ...defaults,
    ...Object.fromEntries(params.entries()),
    collection: "invitations",
    role: "any",
    group: "any",
    venue: "",
    cancelled: "true",
  });
  return (
    <GameLibraryControls
      filters={
        parsed.success ? parsed.data : gameLibraryFilterSchema.parse(defaults)
      }
    />
  );
}
