import type { Metadata } from "next";
import Link from "next/link";

import { getCurrentUser } from "@/features/auth/session";
import { sessionDateKey } from "@/features/sessions/format";
import { GameViewMenu } from "@/features/sessions/game-view-menu";
import { GamesSectionNav } from "@/features/sessions/games-section-nav";
import { openGamesFilterSchema } from "@/features/sessions/open-games";
import { OpenGamesCollection } from "@/features/sessions/open-games-collection";
import { OpenGamesFilters } from "@/features/sessions/open-games-filters";
import { discoverOpenGames } from "@/features/sessions/open-games-queries";

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
  });
  const filters = parsed.success
    ? parsed.data
    : openGamesFilterSchema.parse({});
  const user = await getCurrentUser();
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
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="app-title">Open games</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Find a public game with a clear schedule, court, cost, and roster.
          </p>
        </div>
        <div className="sm:hidden">
          <GameViewMenu />
        </div>
      </div>
      {user ? (
        <GamesSectionNav current="open" />
      ) : (
        <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3 text-sm">
          <p className="text-muted">
            Sign in to join a game and keep it in your Relay schedule.
          </p>
          <Link
            href="/login?next=%2Fgames%2Fopen"
            className="font-semibold text-primary"
          >
            Log in to join
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
      <OpenGamesFilters filters={filters} />
      <div className="mt-6">
        <OpenGamesCollection
          key={`${filters.date}:${filters.dateFrom}:${filters.dateTo}:${filters.time}:${filters.timeFrom}:${filters.timeTo}:${filters.location}:${filters.available}`}
          initialPage={page}
          filters={filters}
          todayKey={todayKey}
          initialMonth={initialMonth}
          initialDate={initialDate}
          isAuthenticated={Boolean(user)}
        />
      </div>
    </div>
  );
}
