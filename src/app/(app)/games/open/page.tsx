import { requireUser } from "@/features/auth/session";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { openGamesFilterSchema } from "@/features/sessions/open-games";
import { OpenGamesCollection } from "@/features/sessions/open-games-collection";
import { OpenGamesFilters } from "@/features/sessions/open-games-filters";
import { discoverOpenGames } from "@/features/sessions/open-games-queries";

export default async function OpenGamesPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string; location?: string; available?: string }>;
}) {
  const params = await searchParams;
  const parsed = openGamesFilterSchema.safeParse({
    date: params.date ?? "any",
    location: params.location ?? "",
    available: params.available ?? "",
  });
  const filters = parsed.success ? parsed.data : openGamesFilterSchema.parse({});
  const user = await requireUser();
  const page = await discoverOpenGames(user.id, filters);

  return (
    <div>
      <h1 className="app-title">Games</h1>
      <GamesSectionNav current="open" />
      {!parsed.success ? (
        <div role="alert" className="mt-5 rounded-lg bg-warning/10 px-4 py-3 text-sm text-ink ring-1 ring-warning/20">
          Those filters weren’t valid, so Relay restored the full list.
        </div>
      ) : null}
      <OpenGamesFilters filters={filters} />
      <div className="mt-6">
        <OpenGamesCollection initialPage={page} filters={filters} />
      </div>
    </div>
  );
}
