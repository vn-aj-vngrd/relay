"use client";

import { CalendarBlank, CaretLeft, CaretRight, GridFour, List, MapPin } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { z } from "zod";

import { MobileViewMenu } from "@/components/ui/mobile-view-menu";
import { TabChipRail } from "@/components/ui/tab-chip-rail";

import { sessionAccentStyle } from "./accent";
import type { GameCollectionItem, GameCollectionPage, GameCollectionPhase } from "./game-collection-types";

export type { GameCollectionItem } from "./game-collection-types";

type ViewMode = "list" | "grid" | "calendar";
type GameFilter = "all" | "upcoming" | "past";
const preferenceKey = "relay-games-view";

const gameItemSchema = z.object({
  id: z.string(),
  href: z.string(),
  title: z.string(),
  date: z.string(),
  dateKey: z.string(),
  endsAt: z.string(),
  time: z.string(),
  venue: z.string(),
  playerCount: z.number(),
  capacity: z.number(),
  status: z.enum(["draft", "published", "live", "completed", "cancelled"]),
  accentColor: z.string(),
  readiness: z
    .object({
      ready: z.boolean(),
      percent: z.number(),
      completed: z.number(),
      total: z.number(),
      missing: z.array(z.string()),
    })
    .optional(),
});
const gamePageSchema = z.object({ items: z.array(gameItemSchema), nextCursor: z.string().nullable() });
const calendarPageSchema = z.object({ upcoming: z.array(gameItemSchema), past: z.array(gameItemSchema) });

function getView(): ViewMode {
  const saved = localStorage.getItem(preferenceKey);
  return saved === "grid" || saved === "calendar" ? saved : "list";
}

function getWeekStart(): "sunday" | "monday" {
  return localStorage.getItem("relay-week-start") === "monday" ? "monday" : "sunday";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === preferenceKey || event.key === "relay-week-start") callback();
  };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("relay-games-view-change", callback);
  window.addEventListener("relay-preferences-change", callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("relay-games-view-change", callback);
    window.removeEventListener("relay-preferences-change", callback);
  };
}

function saveView(mode: ViewMode) {
  localStorage.setItem(preferenceKey, mode);
  window.dispatchEvent(new Event("relay-games-view-change"));
}

const viewOptions = [
  { value: "list" as const, label: "List", icon: List },
  { value: "grid" as const, label: "Grid", icon: GridFour },
  { value: "calendar" as const, label: "Calendar", icon: CalendarBlank },
];

export function GameViewMenu() {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  return <MobileViewMenu label="Game view" value={mode} options={viewOptions} onChange={saveView} />;
}

function GamePageSentinel({
  phase,
  nextCursor,
  loading,
  error,
  onLoad,
}: {
  phase: GameCollectionPhase;
  nextCursor: string | null;
  loading: boolean;
  error: string | null;
  onLoad: (phase: GameCollectionPhase) => Promise<void>;
}) {
  const sentinel = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !nextCursor || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void onLoad(phase);
      },
      { root: target.closest<HTMLElement>(".app-scroll-surface"), rootMargin: "480px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [nextCursor, onLoad, phase]);

  if (!nextCursor && !loading && !error) return null;
  return (
    <div ref={sentinel} className="min-h-14">
      {loading ? (
        <p role="status" className="flex items-center justify-center gap-2 py-5 text-sm text-muted">
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none" />
          Loading more {phase === "upcoming" ? "upcoming" : "past"} games…
        </p>
      ) : null}
      {error ? (
        <div role="alert" className="flex items-center justify-center gap-3 py-4 text-sm text-muted">
          <span>{error}</span>
          <button type="button" onClick={() => void onLoad(phase)} className="font-semibold text-primary">
            Retry
          </button>
        </div>
      ) : null}
      {nextCursor && !loading && !error ? (
        <div className="flex justify-center py-2">
          <button
            type="button"
            onClick={() => void onLoad(phase)}
            className="min-h-9 rounded-lg px-3 text-[13px] font-semibold text-primary hover:bg-primary-soft"
          >
            Load more {phase === "upcoming" ? "upcoming" : "past"} games
          </button>
        </div>
      ) : null}
    </div>
  );
}

function EmptyCollection({ past }: { past?: boolean }) {
  return (
    <div className="border-y border-line py-5 sm:py-8">
      <p className="font-[650]">{past ? "No game memories yet" : "Nothing scheduled"}</p>
      <p className="mt-1 text-sm text-muted">
        {past
          ? "Completed games will stay here with scores and photos."
          : "Create a game, share the link, and let the roster fill itself."}
      </p>
      {!past ? (
        <Link
          href="/games/new"
          className="mt-4 inline-flex min-h-9 items-center rounded-lg bg-primary px-3 text-sm font-[650] text-white hover:bg-primary-hover sm:mt-5"
        >
          Create game
        </Link>
      ) : null}
    </div>
  );
}

function GameList({ items }: { items: GameCollectionItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((game) => (
        <Link
          href={game.href}
          prefetch={false}
          key={game.id}
          style={sessionAccentStyle(game.accentColor)}
          className="collection-row game-list-item pressable group flex min-h-[4.5rem] items-center gap-3 py-3.5 hover:bg-surface sm:min-h-20 sm:gap-4 sm:px-3 sm:py-4"
        >
          <time className="score hidden w-20 shrink-0 text-sm font-bold text-primary sm:block">{game.date}</time>
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-[650]">{game.title}</h3>
            <p className="mt-1 truncate text-[13px] text-muted sm:text-sm">
              <time className="score font-bold text-primary sm:hidden">{game.date}</time>
              <span className="sm:hidden"> · </span>
              {game.time} · {game.venue}
            </p>
          </div>
          {game.readiness ? (
            <span
              className={`hidden text-xs font-[650] sm:block ${game.readiness.ready ? "text-success" : "text-muted"}`}
            >
              {game.readiness.ready ? "Ready" : `${game.readiness.percent}% ready`}
            </span>
          ) : (
            <span className="score hidden text-sm text-muted sm:block">
              {game.playerCount} / {game.capacity}
            </span>
          )}
          <CaretRight aria-hidden size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}

function GameGrid({ items }: { items: GameCollectionItem[] }) {
  return (
    <div className="grid gap-3 min-[380px]:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {items.map((game) => (
        <Link
          href={game.href}
          prefetch={false}
          key={game.id}
          style={sessionAccentStyle(game.accentColor)}
          className="game-grid-item pressable group rounded-lg border border-line bg-surface p-3.5 hover:border-primary/35 hover:bg-surface-strong sm:p-5"
        >
          <article className="flex h-full min-w-0 flex-col">
            <div className="flex items-center justify-between gap-4">
              <time className="score text-xs font-bold text-primary">{game.date}</time>
              <span className="score text-xs text-muted">
                {game.playerCount} / {game.capacity}
              </span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-[15px] font-[680] leading-5 sm:mt-5 sm:truncate sm:text-lg sm:leading-normal">
              {game.title}
            </h3>
            <div className="mt-2 space-y-1.5 text-[13px] text-muted sm:mt-3 sm:space-y-2 sm:text-sm">
              <p className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <CalendarBlank aria-hidden size={15} className="shrink-0" />
                <span className="truncate">{game.time}</span>
              </p>
              <p className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <MapPin aria-hidden size={15} className="shrink-0" />
                <span className="truncate">{game.venue}</span>
              </p>
            </div>
            {game.readiness ? (
              <div className="mt-3 sm:mt-5">
                <div className="flex items-center justify-between text-xs">
                  <span className="text-muted">Game setup</span>
                  <span
                    className={game.readiness.ready ? "font-semibold text-success" : "score font-semibold text-muted"}
                  >
                    {game.readiness.ready ? "Ready" : `${game.readiness.percent}%`}
                  </span>
                </div>
                <div className="mt-2 h-1 overflow-hidden rounded-full bg-surface-strong">
                  <span
                    className={`block h-full rounded-full ${game.readiness.ready ? "bg-success" : "bg-primary"}`}
                    style={{ width: `${game.readiness.percent}%` }}
                  />
                </div>
              </div>
            ) : null}
            <span className="mt-6 hidden items-center gap-1 text-sm font-[650] text-primary sm:inline-flex">
              Open game{" "}
              <CaretRight aria-hidden size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </article>
        </Link>
      ))}
    </div>
  );
}

function MonthCalendar({
  upcoming,
  past,
  todayKey,
  weekStart,
  monthKey,
  onMonthChange,
}: {
  upcoming: GameCollectionItem[];
  past: GameCollectionItem[];
  todayKey: string;
  weekStart: "sunday" | "monday";
  monthKey: string;
  onMonthChange: (monthKey: string) => void;
}) {
  const month = new Date(`${monthKey}-01T00:00:00Z`);
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const leadingDays = weekStart === "monday" ? (month.getUTCDay() + 6) % 7 : month.getUTCDay();
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const games = [
    ...upcoming.map((game) => ({ ...game, phase: game.status === "live" ? ("live" as const) : ("upcoming" as const) })),
    ...past.map((game) => ({ ...game, phase: "past" as const })),
  ];
  const gamesByDate = new Map<string, typeof games>();
  games.forEach((game) => gamesByDate.set(game.dateKey, [...(gamesByDate.get(game.dateKey) ?? []), game]));
  const changeMonth = (amount: number) => {
    const next = new Date(Date.UTC(year, monthIndex + amount, 1));
    onMonthChange(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(month);
  const cells = [
    ...Array.from({ length: leadingDays }, () => null),
    ...Array.from({ length: dayCount }, (_, index) => index + 1),
  ];

  return (
    <section aria-labelledby="calendar-month">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 id="calendar-month" className="text-xl font-[680]">
            {title}
          </h2>
          <p className="mt-1 text-sm text-muted">
            <span className="text-live">● Live</span>
            <span className="mx-2">·</span>
            <span className="text-primary">● Upcoming</span>
            <span className="mx-2">·</span>Past
          </p>
        </div>
        <div className="flex self-end gap-1 sm:self-auto">
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
          >
            <CaretLeft aria-hidden size={16} />
          </button>
          <button
            type="button"
            onClick={() => onMonthChange(todayKey.slice(0, 7))}
            className="pressable min-h-9 rounded-md px-2.5 text-[13px] font-[650] text-muted hover:bg-surface-strong hover:text-ink"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
          >
            <CaretRight aria-hidden size={16} />
          </button>
        </div>
      </div>
      <div className="grid grid-cols-7 text-center text-xs font-[650] text-muted">
        {(weekStart === "monday"
          ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
          : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
        ).map((day) => (
          <div key={day} className="py-2">
            {day}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7 border-l border-t border-line">
        {cells.map((day, index) => {
          if (!day)
            return (
              <div
                key={`empty-${index}`}
                aria-hidden
                className="min-h-14 border-b border-r border-line bg-surface/35 sm:min-h-28"
              />
            );
          const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
          const dayGames = gamesByDate.get(dateKey) ?? [];
          const fullDate = new Intl.DateTimeFormat("en-US", {
            weekday: "long",
            month: "long",
            day: "numeric",
            timeZone: "UTC",
          }).format(new Date(`${dateKey}T00:00:00Z`));
          return (
            <div
              key={dateKey}
              role="group"
              aria-label={`${fullDate}, ${dayGames.length} ${dayGames.length === 1 ? "game" : "games"}`}
              className={`min-h-14 min-w-0 border-b border-r border-line p-1.5 sm:min-h-28 sm:p-2 ${dateKey === todayKey ? "bg-primary-soft/55" : "bg-surface"}`}
            >
              <time
                dateTime={dateKey}
                className={`score text-xs font-semibold ${dateKey === todayKey ? "text-primary" : "text-muted"}`}
              >
                {day}
              </time>
              <div className="mt-1 space-y-1">
                {dayGames.slice(0, 2).map((game) => (
                  <Link
                    key={game.id}
                    href={game.href}
                    prefetch={false}
                    style={sessionAccentStyle(game.accentColor)}
                    className={`block min-h-5 rounded-md px-1.5 py-1 text-left text-[11px] font-[650] leading-4 ${game.phase === "live" ? "bg-live/12 text-live" : game.phase === "upcoming" ? "bg-primary-soft text-primary" : "bg-surface-strong text-muted"}`}
                  >
                    <span className="sr-only sm:not-sr-only sm:line-clamp-1">{game.title}</span>
                    <span
                      aria-hidden
                      className={`mx-auto block h-1.5 w-1.5 rounded-full sm:hidden ${game.phase === "live" ? "bg-live" : game.phase === "upcoming" ? "bg-primary" : "bg-muted"}`}
                    />
                  </Link>
                ))}
                {dayGames.length > 2 ? (
                  <p className="text-center text-[10px] text-muted">+{dayGames.length - 2}</p>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function CollectionSection({
  title,
  items,
  mode,
  past,
  live,
  footer,
}: {
  title: string;
  items: GameCollectionItem[];
  mode: Exclude<ViewMode, "calendar">;
  past?: boolean;
  live?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <section>
      <h2 className={`mb-3 flex items-center gap-2 text-lg font-[680] ${live ? "text-live" : ""}`}>
        {live ? <span aria-hidden className="h-2 w-2 rounded-full bg-live" /> : null}
        {title}
      </h2>
      {items.length ? (
        mode === "grid" ? (
          <GameGrid items={items} />
        ) : (
          <GameList items={items} />
        )
      ) : (
        <EmptyCollection past={past} />
      )}
      {footer}
    </section>
  );
}

export function GameCollection({
  upcomingPage,
  pastPage,
  todayKey,
}: {
  upcomingPage: GameCollectionPage;
  pastPage: GameCollectionPage;
  todayKey: string;
}) {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  const weekStart = useSyncExternalStore(subscribe, getWeekStart, (): "sunday" | "monday" => "sunday");
  const [filter, setFilter] = useState<GameFilter>("upcoming");
  const [upcoming, setUpcoming] = useState(upcomingPage.items);
  const [past, setPast] = useState(pastPage.items);
  const [upcomingCursor, setUpcomingCursor] = useState(upcomingPage.nextCursor);
  const [pastCursor, setPastCursor] = useState(pastPage.nextCursor);
  const [loadingPhase, setLoadingPhase] = useState<GameCollectionPhase | null>(null);
  const [pageErrors, setPageErrors] = useState<Partial<Record<GameCollectionPhase, string>>>({});
  const loadingPhaseRef = useRef<GameCollectionPhase | null>(null);
  const [monthKey, setMonthKey] = useState(todayKey.slice(0, 7));
  const [calendarData, setCalendarData] = useState<{
    upcoming: GameCollectionItem[];
    past: GameCollectionItem[];
  } | null>(null);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarRetry, setCalendarRetry] = useState(0);

  const loadMore = useCallback(
    async (phase: GameCollectionPhase) => {
      const cursor = phase === "upcoming" ? upcomingCursor : pastCursor;
      if (!cursor || loadingPhaseRef.current) return;
      loadingPhaseRef.current = phase;
      setLoadingPhase(phase);
      setPageErrors((current) => ({ ...current, [phase]: undefined }));
      try {
        const params = new URLSearchParams({ phase, cursor });
        const response = await fetch(`/api/games?${params}`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
        });
        if (!response.ok)
          throw new Error(
            response.status === 429
              ? "Loading is temporarily limited. Try again shortly."
              : "More games could not be loaded.",
          );
        const parsed = gamePageSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("The server returned an invalid game page.");
        const append = (current: GameCollectionItem[]) => {
          const ids = new Set(current.map((item) => item.id));
          return [...current, ...parsed.data.items.filter((item) => !ids.has(item.id))];
        };
        if (phase === "upcoming") {
          setUpcoming(append);
          setUpcomingCursor(parsed.data.nextCursor);
        } else {
          setPast(append);
          setPastCursor(parsed.data.nextCursor);
        }
      } catch (cause) {
        setPageErrors((current) => ({
          ...current,
          [phase]: cause instanceof Error ? cause.message : "More games could not be loaded.",
        }));
      } finally {
        loadingPhaseRef.current = null;
        setLoadingPhase(null);
      }
    },
    [pastCursor, upcomingCursor],
  );

  useEffect(() => {
    if (mode !== "calendar") return;
    const controller = new AbortController();
    setCalendarData(null);
    setCalendarError(null);
    void fetch(`/api/games?month=${monthKey}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("This month could not be loaded.");
        const parsed = calendarPageSchema.safeParse(await response.json());
        if (!parsed.success) throw new Error("The server returned invalid calendar data.");
        setCalendarData(parsed.data);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setCalendarError(cause instanceof Error ? cause.message : "This month could not be loaded.");
      });
    return () => controller.abort();
  }, [calendarRetry, mode, monthKey]);

  const liveGames = upcoming.filter((game) => game.status === "live");
  const scheduledGames = upcoming.filter((game) => game.status !== "live");
  const visibleUpcoming = filter === "past" ? [] : upcoming;
  const visiblePast = filter === "upcoming" ? [] : past;
  const visibleCount = visibleUpcoming.length + visiblePast.length;
  const hasVisibleMore =
    (filter !== "past" && Boolean(upcomingCursor)) || (filter !== "upcoming" && Boolean(pastCursor));
  const filterItems = [
    { value: "upcoming" as const, label: "Upcoming" },
    { value: "all" as const, label: "All" },
    { value: "past" as const, label: "Past" },
  ];

  const upcomingFooter = (
    <GamePageSentinel
      phase="upcoming"
      nextCursor={upcomingCursor}
      loading={loadingPhase === "upcoming"}
      error={pageErrors.upcoming ?? null}
      onLoad={loadMore}
    />
  );
  const pastFooter = (
    <GamePageSentinel
      phase="past"
      nextCursor={pastCursor}
      loading={loadingPhase === "past"}
      error={pageErrors.past ?? null}
      onLoad={loadMore}
    />
  );

  return (
    <div className="mt-4 sm:mt-10">
      <div className="mb-5 border-b border-line pb-3 sm:mb-8 sm:pb-4">
        <div className="hidden items-center justify-between gap-4 sm:flex">
          <p aria-live="polite" className="text-sm text-muted">
            {visibleCount}
            {hasVisibleMore ? "+" : ""} {visibleCount === 1 && !hasVisibleMore ? "game" : "games"}
          </p>
          <div role="group" aria-label="Game view" className="inline-flex rounded-lg bg-surface-strong p-1">
            {viewOptions.map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-label={`${label} view`}
                aria-pressed={mode === value}
                onClick={() => saveView(value)}
                className={`pressable grid h-9 w-9 place-items-center rounded-lg ${mode === value ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}
              >
                <Icon aria-hidden size={value === "grid" ? 17 : 18} />
              </button>
            ))}
          </div>
        </div>
        <div className="min-w-0 sm:mt-3">
          <TabChipRail
            label="Filter games"
            items={filterItems}
            value={filter}
            onChange={setFilter}
            className="min-w-0"
          />
        </div>
      </div>
      {mode === "calendar" ? (
        calendarError ? (
          <div role="alert" className="border-y border-line py-8 text-center">
            <p className="text-sm text-muted">{calendarError}</p>
            <button
              type="button"
              onClick={() => setCalendarRetry((value) => value + 1)}
              className="mt-3 font-semibold text-primary"
            >
              Retry
            </button>
          </div>
        ) : calendarData ? (
          <div data-testid="games-calendar">
            <MonthCalendar
              upcoming={filter === "past" ? [] : calendarData.upcoming}
              past={filter === "upcoming" ? [] : calendarData.past}
              todayKey={todayKey}
              weekStart={weekStart}
              monthKey={monthKey}
              onMonthChange={setMonthKey}
            />
          </div>
        ) : (
          <div role="status" className="border-y border-line py-10 text-center text-sm text-muted">
            Loading game calendar…
          </div>
        )
      ) : (
        <div data-testid={mode === "grid" ? "games-grid" : "games-list"} className="space-y-10 sm:space-y-12">
          {filter !== "past" && liveGames.length ? (
            <CollectionSection title="Live now" items={liveGames} mode={mode} live />
          ) : null}
          {filter !== "past" && (scheduledGames.length || !liveGames.length || upcomingCursor) ? (
            <CollectionSection title="Upcoming" items={scheduledGames} mode={mode} footer={upcomingFooter} />
          ) : null}
          {filter !== "upcoming" ? (
            <CollectionSection title="Past games" items={past} mode={mode} past footer={pastFooter} />
          ) : null}
        </div>
      )}
    </div>
  );
}
