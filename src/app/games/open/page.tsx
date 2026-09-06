import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import { GamesCollectionHeader } from "@/features/sessions/games-collection-header";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { openGamesFilterSchema } from "@/features/sessions/open-games";
import { OpenGamesCollection } from "@/features/sessions/open-games-collection";
import { OpenGamesFilters } from "@/features/sessions/open-games-filters";
import { discoverOpenGames } from "@/features/sessions/open-games-queries";
import { getInvitationCount } from "@/features/sessions/queries";

export const metadata: Metadata = {
  title: "Open pickleball games",
  description:
    "Explore upcoming public pickleball games, compare courts, schedules, costs, and available spots, then join through Relay.",
  alternates: { canonical: "/games/open" },
};

function validDate(value: string | undefined) {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

import {
  GameResults,
  GameResultsTransition,
} from "@/features/sessions/game-results-transition";

export default async function OpenGamesPage({
  searchParams,
}: {
  searchParams: Promise<{
    date?: string;
    dateFrom?: string;
    dateTo?: string;
    time?: string;
    timeFrom?: string;
    timeTo?: string;
    location?: string;
    available?: string;
    price?: string;
    minPrice?: string;
    maxPrice?: string;
    month?: string;
    selectedDate?: string;
  }>;
}) {
  const params = await searchParams;
  const parsed = openGamesFilterSchema.safeParse({
    date: params.date ?? "any",
    dateFrom: params.dateFrom ?? "",
    dateTo: params.dateTo ?? "",
    time: params.time ?? "any",
    timeFrom: params.timeFrom ?? "",
    timeTo: params.timeTo ?? "",
    location: params.location ?? "",
    available: params.available,
    price: params.price ?? "any",
    minPrice: params.minPrice ?? "",
    maxPrice: params.maxPrice ?? "",
  });
  const filters = parsed.success
    ? parsed.data
    : openGamesFilterSchema.parse({});
  const user = await getCurrentUser();
  const invitationCount = user ? await getInvitationCount(user.id) : 0;
  const page = await discoverOpenGames(user?.id, filters);
  const todayKey = sessionDateKey(new Date());
  const initialMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(params.month ?? "")
    ? params.month!
    : todayKey.slice(0, 7);
  const initialDate =
    validDate(params.selectedDate) &&
    params.selectedDate!.startsWith(initialMonth)
      ? params.selectedDate!
      : initialMonth === todayKey.slice(0, 7)
        ? todayKey
        : `${initialMonth}-01`;

  return (
    <div>
      <GamesCollectionHeader title="Open games" />
      {user ? (
        <GamesSectionNav current="open" invitationCount={invitationCount} />
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-sm">
          <p className="text-muted">
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
      {!parsed.success ? (
        <div
          role="alert"
          className="mt-5 rounded-lg bg-warning/10 px-4 py-3 text-sm text-ink ring-1 ring-warning/20"
        >
          Those filters weren’t valid, so Relay restored the full list.
        </div>
      ) : null}
      <GameResultsTransition>
        <OpenGamesFilters filters={filters} />
        <div className="mt-6">
          <GameResults discovery>
            <OpenGamesCollection
              key={`${filters.date}:${filters.dateFrom}:${filters.dateTo}:${filters.time}:${filters.timeFrom}:${filters.timeTo}:${filters.location}:${filters.available}:${filters.price}:${filters.minPrice}:${filters.maxPrice}`}
              initialPage={page}
              filters={filters}
              todayKey={todayKey}
              initialMonth={initialMonth}
              initialDate={initialDate}
              isAuthenticated={Boolean(user)}
            />
          </GameResults>
        </div>
      </GameResultsTransition>
    </div>
  );
}
