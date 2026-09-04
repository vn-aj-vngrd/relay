"use client";

import {
  CalendarBlank,
  CaretRight,
  MapPin,
  UsersThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { z } from "zod";

import { trackDiscoveryEvent } from "@/features/analytics/actions";

import { sessionAccentStyle } from "./accent";
import type { GameCollectionItem } from "./game-collection-types";
import { useGameViewMode } from "./game-view-menu";
import { GamesCalendar } from "./games-calendar";
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
  playerPriceCents: z.number(),
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
  return `${new Intl.NumberFormat("en-PH", { style: "currency", currency: "PHP", maximumFractionDigits: 2 }).format(cents / 100)} per player`;
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

function trackOpenGame(gameId: string) {
  void trackDiscoveryEvent({
    event: "public_game_opened",
    sessionId: gameId,
    source: "open-games",
  });
}

function openGameHref(game: OpenGameItem, isAuthenticated: boolean) {
  return isAuthenticated
    ? `/games/${game.id}?source=open-games`
    : `/s/${game.slug}?source=open-games`;
}

function manilaDateKey(value: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    timeZone: "Asia/Manila",
  }).formatToParts(new Date(value));
  const part = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

function toCalendarGame(
  game: OpenGameItem,
  isAuthenticated: boolean
): GameCollectionItem {
  return {
    id: game.id,
    href: openGameHref(game, isAuthenticated),
    title: game.title,
    date: game.date,
    dateKey: manilaDateKey(game.startsAt),
    endsAt: game.endsAt,
    time: game.time,
    venue: game.venue,
    playerCount: game.playerCount,
    capacity: game.capacity,
    status: game.status,
    accentColor: game.accentColor,
    viewerRsvp: game.viewerRsvp ?? "declined",
    invitedAt: game.startsAt,
    hostName: game.hostName,
    playerPriceCents: game.playerPriceCents,
    requiresApproval: game.requiresApproval,
    spotsRemaining: Math.max(0, game.capacity - game.playerCount),
    canReplay: false,
  };
}

function getWeekStart(): "sunday" | "monday" {
  return localStorage.getItem("relay-week-start") === "monday"
    ? "monday"
    : "sunday";
}

function subscribeToWeekStart(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener("relay-preferences-change", callback);
  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener("relay-preferences-change", callback);
  };
}

function OpenGameRow({
  game,
  isAuthenticated,
}: {
  game: OpenGameItem;
  isAuthenticated: boolean;
}) {
  return (
    <Link
      href={openGameHref(game, isAuthenticated)}
      prefetch={false}
      onClick={() => trackOpenGame(game.id)}
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
            {peso(game.playerPriceCents)}
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

function OpenGameCard({
  game,
  isAuthenticated,
}: {
  game: OpenGameItem;
  isAuthenticated: boolean;
}) {
  return (
    <article
      style={sessionAccentStyle(game.accentColor)}
      className="game-grid-item flex min-w-0 flex-col rounded-lg border border-line bg-surface p-3.5 hover:border-primary/35 sm:p-5"
    >
      <Link
        href={openGameHref(game, isAuthenticated)}
        prefetch={false}
        onClick={() => trackOpenGame(game.id)}
        className="pressable group flex min-w-0 flex-1 flex-col"
      >
        <div className="flex items-start justify-between gap-3">
          <time className="score text-xs font-bold text-primary">
            {game.date}
          </time>
          <span className="score text-right text-xs text-muted">
            {game.playerCount} / {game.capacity}
          </span>
        </div>
        <h2 className="mt-3 line-clamp-2 text-[15px] font-[680] leading-5 group-hover:text-primary sm:mt-5 sm:text-lg sm:leading-normal">
          {game.title}
        </h2>
        <p className="mt-1 text-xs text-muted">Hosted by {game.hostName}</p>
        <div className="mt-3 space-y-1.5 text-[13px] text-muted sm:space-y-2 sm:text-sm">
          <p className="flex min-w-0 items-center gap-2">
            <CalendarBlank aria-hidden size={15} className="shrink-0" />
            <span className="truncate">{game.time}</span>
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <MapPin aria-hidden size={15} className="shrink-0" />
            <span className="truncate">{game.venue}</span>
          </p>
          <p className="flex min-w-0 items-center gap-2">
            <UsersThree aria-hidden size={15} className="shrink-0" />
            <span>{rosterState(game)}</span>
          </p>
        </div>
        <div className="mt-auto flex items-end justify-between gap-3 pt-5">
          <div>
            <p className="score text-sm font-bold text-ink">
              {peso(game.playerPriceCents)}
            </p>
            {game.requiresApproval && !game.viewerRsvp ? (
              <p className="mt-1 text-xs text-muted">Approval required</p>
            ) : null}
          </div>
          <span className="inline-flex items-center gap-1 text-sm font-[650] text-primary">
            Open
            <CaretRight
              aria-hidden
              size={14}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </span>
        </div>
      </Link>
    </article>
  );
}

export function OpenGamesCollection({
  initialPage,
  filters,
  todayKey,
  initialMonth,
  initialDate,
  isAuthenticated = true,
}: {
  initialPage: OpenGamesPage;
  filters: OpenGamesFilters;
  todayKey?: string;
  initialMonth?: string;
  initialDate?: string;
  isAuthenticated?: boolean;
}) {
  const resolvedTodayKey = todayKey ?? manilaDateKey(new Date().toISOString());
  const mode = useGameViewMode();
  const weekStart = useSyncExternalStore(
    subscribeToWeekStart,
    getWeekStart,
    (): "sunday" | "monday" => "sunday"
  );
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const [monthKey, setMonthKey] = useState(
    initialMonth ?? resolvedTodayKey.slice(0, 7)
  );
  const [selectedDate, setSelectedDate] = useState(
    initialDate ?? resolvedTodayKey
  );
  const [calendarItems, setCalendarItems] = useState<OpenGameItem[]>([]);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarRetry, setCalendarRetry] = useState(0);
  const calendarCache = useRef(new Map<string, OpenGameItem[]>());
  const calendarGames = useMemo(
    () => calendarItems.map((game) => toCalendarGame(game, isAuthenticated)),
    [calendarItems, isAuthenticated]
  );

  useEffect(() => {
    void trackDiscoveryEvent({
      event: "open_games_viewed",
      source: "open-games",
    });
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const requestedMonth = params.get("month");
      const nextMonth = /^\d{4}-(0[1-9]|1[0-2])$/.test(requestedMonth ?? "")
        ? requestedMonth!
        : resolvedTodayKey.slice(0, 7);
      const requestedDate = params.get("selectedDate");
      const nextDate =
        requestedDate?.startsWith(nextMonth) &&
        /^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(requestedDate)
          ? requestedDate
          : nextMonth === resolvedTodayKey.slice(0, 7)
            ? resolvedTodayKey
            : `${nextMonth}-01`;
      setMonthKey(nextMonth);
      setSelectedDate(nextDate);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [resolvedTodayKey]);

  useEffect(() => {
    if (mode !== "calendar") return;
    const controller = new AbortController();
    const cached = calendarCache.current.get(monthKey);
    setCalendarItems(cached ?? []);
    setCalendarLoading(true);
    setCalendarError(null);

    const loadMonth = async () => {
      const monthItems: OpenGameItem[] = [];
      let cursor = "";
      do {
        const params = new URLSearchParams({
          month: monthKey,
          date: filters.date,
          dateFrom: filters.dateFrom,
          dateTo: filters.dateTo,
          time: filters.time,
          timeFrom: filters.timeFrom,
          timeTo: filters.timeTo,
          location: filters.location,
          available: filters.available ? "1" : "",
          price: filters.price,
          minPrice:
            filters.minPrice === null ? "" : String(filters.minPrice / 100),
          maxPrice:
            filters.maxPrice === null ? "" : String(filters.maxPrice / 100),
        });
        if (cursor) params.set("cursor", cursor);
        const response = await fetch(`/api/games/open?${params}`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok) throw new Error("This month could not be loaded.");
        const parsed = pageSchema.safeParse(await response.json());
        if (!parsed.success)
          throw new Error("The server returned invalid calendar data.");
        monthItems.push(...parsed.data.items);
        cursor = parsed.data.nextCursor ?? "";
      } while (cursor && !controller.signal.aborted);
      if (controller.signal.aborted) return;
      calendarCache.current.set(monthKey, monthItems);
      setCalendarItems(monthItems);
    };

    void loadMonth()
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setCalendarError(
          cause instanceof Error
            ? cause.message
            : "This month could not be loaded."
        );
      })
      .finally(() => {
        if (!controller.signal.aborted) setCalendarLoading(false);
      });
    return () => controller.abort();
  }, [calendarRetry, filters, mode, monthKey]);

  const updateCalendarUrl = (nextMonth: string, nextDate: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set("month", nextMonth);
    url.searchParams.set("selectedDate", nextDate);
    window.history.pushState(null, "", `${url.pathname}?${url.searchParams}`);
  };
  const handleMonthChange = (nextMonth: string, nextDate: string) => {
    setMonthKey(nextMonth);
    setSelectedDate(nextDate);
    updateCalendarUrl(nextMonth, nextDate);
  };
  const handleDateSelect = (nextDate: string) => {
    setSelectedDate(nextDate);
    const url = new URL(window.location.href);
    url.searchParams.set("month", nextDate.slice(0, 7));
    url.searchParams.set("selectedDate", nextDate);
    window.history.replaceState(
      null,
      "",
      `${url.pathname}?${url.searchParams}`
    );
  };

  const loadMore = useCallback(async () => {
    if (!nextCursor || loading) return;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({
        cursor: nextCursor,
        date: filters.date,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        time: filters.time,
        timeFrom: filters.timeFrom,
        timeTo: filters.timeTo,
        location: filters.location,
        available: filters.available ? "1" : "",
        price: filters.price,
        minPrice:
          filters.minPrice === null ? "" : String(filters.minPrice / 100),
        maxPrice:
          filters.maxPrice === null ? "" : String(filters.maxPrice / 100),
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
  }, [filters, loading, nextCursor]);

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

  if (mode === "calendar")
    return (
      <div data-testid="open-games-calendar">
        <GamesCalendar
          upcoming={calendarGames}
          past={[]}
          todayKey={resolvedTodayKey}
          weekStart={weekStart}
          monthKey={monthKey}
          selectedDate={selectedDate}
          loading={calendarLoading}
          error={calendarError}
          onMonthChange={handleMonthChange}
          onSelectDate={handleDateSelect}
          onRetry={() => setCalendarRetry((value) => value + 1)}
        />
      </div>
    );

  return (
    <div data-testid={mode === "grid" ? "open-games-grid" : "open-games-list"}>
      {mode === "grid" ? (
        <div className="grid gap-3 min-[380px]:grid-cols-2 sm:gap-4 xl:grid-cols-3">
          {items.map((game) => (
            <OpenGameCard
              key={game.id}
              game={game}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      ) : (
        <div className="divide-y divide-line border-t border-line">
          {items.map((game) => (
            <OpenGameRow
              key={game.id}
              game={game}
              isAuthenticated={isAuthenticated}
            />
          ))}
        </div>
      )}
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
