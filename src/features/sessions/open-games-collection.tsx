"use client";

import {
  CalendarBlank,
  CaretRight,
  MapPin,
  UsersThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { trackDiscoveryEvent } from "@/features/analytics/actions";

import { sessionAccentStyle } from "./accent";
import type {
  OpenGameItem,
  OpenGamesFilters,
  OpenGamesPage,
} from "./open-games";

const itemSchema = z.object({
  id: z.string(),
  slug: z.string(),
  title: z.string(),
  startsAt: z.string(),
  endsAt: z.string(),
  date: z.string(),
  time: z.string(),
  venue: z.string(),
  venueAddress: z.string().nullable(),
  hostName: z.string(),
  playerCount: z.number(),
  capacity: z.number(),
  estimatedCostCents: z.number(),
  requiresApproval: z.boolean(),
  status: z.enum(["published", "live"]),
  accentColor: z.string(),
  viewerRsvp: z
    .enum(["invited", "pending", "going", "maybe", "waitlisted", "declined"])
    .nullable(),
});
const pageSchema = z.object({
  items: z.array(itemSchema),
  nextCursor: z.string().nullable(),
});

function peso(cents: number) {
  if (cents === 0) return "Free";
  return `${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(cents / 100)} est.`;
}

function rosterState(game: OpenGameItem) {
  if (game.viewerRsvp === "going") return "Going";
  if (game.viewerRsvp === "pending") return "Pending approval";
  if (game.viewerRsvp === "waitlisted") return "Waitlisted";
  if (game.viewerRsvp === "maybe") return "Maybe";
  const spots = Math.max(0, game.capacity - game.playerCount);
  if (!spots) return "Waitlist open";
  return `${spots} ${spots === 1 ? "spot" : "spots"} left`;
}

function OpenGameRow({ game }: { game: OpenGameItem }) {
  return (
    <Link
      href={`/games/${game.id}?source=open-games`}
      prefetch={false}
      onClick={() =>
        void trackDiscoveryEvent({
          event: "public_game_opened",
          sessionId: game.id,
          source: "open-games",
        })
      }
      style={sessionAccentStyle(game.accentColor)}
      className="collection-row pressable group block px-2 py-4 hover:bg-surface-strong sm:grid sm:min-h-24 sm:grid-cols-[minmax(0,1.4fr)_minmax(9rem,1fr)_auto] sm:items-center sm:gap-6 sm:px-3"
    >
      <div className="min-w-0">
        <div className="flex items-center gap-2">
          <span
            aria-hidden
            className="h-7 w-1 shrink-0 rounded-full bg-primary"
          />
          <div className="min-w-0">
            <h2 className="truncate font-[680]">{game.title}</h2>
            <p className="mt-1 truncate text-sm text-muted">
              Hosted by {game.hostName}
            </p>
          </div>
        </div>
      </div>
      <div className="mt-3 min-w-0 space-y-1.5 text-sm text-muted sm:mt-0">
        <p className="flex min-w-0 items-center gap-2">
          <CalendarBlank aria-hidden size={15} className="shrink-0" />
          <span className="truncate">
            <span className="score font-semibold text-ink">{game.date}</span> ·{" "}
            {game.time}
          </span>
        </p>
        <p className="flex min-w-0 items-center gap-2">
          <MapPin aria-hidden size={15} className="shrink-0" />
          <span className="truncate">{game.venue}</span>
        </p>
      </div>
      <div className="mt-3 flex items-center justify-between gap-3 border-t border-line pt-3 sm:mt-0 sm:justify-end sm:border-0 sm:pt-0">
        <div className="text-left sm:text-right">
          <p className="score text-sm font-bold text-ink">
            {peso(game.estimatedCostCents)}
          </p>
          <p className="mt-1 flex items-center gap-1.5 text-xs text-muted sm:justify-end">
            <UsersThree aria-hidden size={14} /> {game.playerCount}/
            {game.capacity} · {rosterState(game)}
          </p>
          {game.requiresApproval && !game.viewerRsvp ? (
            <p className="mt-1 text-xs text-muted">Host approval required</p>
          ) : null}
        </div>
        <CaretRight
          aria-hidden
          size={16}
          className="shrink-0 text-muted transition-transform group-hover:translate-x-0.5"
        />
      </div>
    </Link>
  );
}

export function OpenGamesCollection({
  initialPage,
  filters,
}: {
  initialPage: OpenGamesPage;
  filters: OpenGamesFilters;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    void trackDiscoveryEvent({
      event: "open_games_viewed",
      source: "open-games",
    });
  }, []);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        cursor: nextCursor,
        date: filters.date,
        location: filters.location,
        available: filters.available ? "1" : "",
      });
      const response = await fetch(`/api/games/open?${params}`, {
        headers: { Accept: "application/json" },
      });
      if (!response.ok) throw new Error("OPEN_GAMES_FAILED");
      const parsed = pageSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("INVALID_OPEN_GAMES");
      setItems((current) => [...current, ...parsed.data.items]);
      setNextCursor(parsed.data.nextCursor);
    } catch {
      setError("More open games couldn’t be loaded.");
    } finally {
      setLoading(false);
    }
  }, [filters.available, filters.date, filters.location, loading, nextCursor]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !nextCursor || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      {
        root: target.closest<HTMLElement>(".app-scroll-surface"),
        rootMargin: "480px 0px",
      }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  if (!items.length)
    return (
      <section className="py-9">
        <h2 className="text-lg font-bold">No open games match these filters</h2>
        <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
          Try a wider date range, remove the location, or include games whose
          roster is full. New public games will appear here when hosts publish
          them.
        </p>
        <Link
          href="/games/open"
          className="mt-4 inline-flex min-h-11 items-center rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover sm:min-h-10"
        >
          Clear filters
        </Link>
      </section>
    );

  return (
    <div>
      <div className="divide-y divide-line border-t border-line">
        {items.map((game) => (
          <OpenGameRow key={game.id} game={game} />
        ))}
      </div>
      <div
        ref={sentinelRef}
        className="flex min-h-16 items-center justify-center"
      >
        {loading ? (
          <p role="status" className="text-sm text-muted">
            Loading more open games…
          </p>
        ) : null}
        {error ? (
          <div
            role="alert"
            className="flex items-center gap-3 text-sm text-muted"
          >
            <span>{error}</span>
            <button
              type="button"
              onClick={() => void loadMore()}
              className="min-h-11 font-semibold text-primary sm:min-h-9"
            >
              Retry
            </button>
          </div>
        ) : null}
        {nextCursor && !loading && !error ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            className="min-h-11 px-3 text-sm font-semibold text-primary sm:min-h-9"
          >
            Load more games
          </button>
        ) : null}
        {!nextCursor && !loading && !error ? (
          <p className="text-xs text-muted">All matching open games loaded</p>
        ) : null}
      </div>
    </div>
  );
}
