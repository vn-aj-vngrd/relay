"use client";

import { CalendarBlank, CalendarPlus, CaretRight, MapPin } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { z } from "zod";

import { ButtonLink } from "@/components/ui/button";
import { TabChipRail } from "@/components/ui/tab-chip-rail";

import { sessionAccentStyle } from "./accent";
import type {
  GameCollectionItem,
  GameCollectionPage,
  GameCollectionPhase,
  GameInvitationPage,
} from "./game-collection-types";
import type { ActiveInviteResponse } from "./game-invitation-card";
import { GameInvitationCard } from "./game-invitation-card";
import { GameDesktopViewControls } from "./game-view-menu";
import { GamesCalendar } from "./games-calendar";

export type { GameCollectionItem } from "./game-collection-types";
export { GameViewMenu } from "./game-view-menu";

type ViewMode = "list" | "grid" | "calendar";
type GameFilter = "upcoming" | "invites" | "past";
const preferenceKey = "relay-games-view";
const emptyInvitationPage: GameInvitationPage = { items: [], total: 0 };

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
  viewerRsvp: z.enum(["invited", "pending", "going", "maybe", "waitlisted", "declined"]),
  invitedAt: z.string(),
  hostName: z.string(),
  estimatedCostCents: z.number().nullable(),
  requiresApproval: z.boolean(),
  spotsRemaining: z.number(),
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
type CalendarPage = z.infer<typeof calendarPageSchema>;

function validMonth(value: string | null): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value;
}

function updateGamesUrl(
  values: { filter?: GameFilter; month?: string; date?: string },
  behavior: "push" | "replace" = "replace",
) {
  const url = new URL(window.location.href);
  if (values.filter) url.searchParams.set("filter", values.filter);
  if (values.month) url.searchParams.set("month", values.month);
  if (values.date) url.searchParams.set("date", values.date);
  window.history[behavior === "push" ? "pushState" : "replaceState"](null, "", `${url.pathname}?${url.searchParams}`);
}

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

function EmptyInvitations() {
  return (
    <div className="border-y border-line py-5 sm:py-8">
      <p className="font-[650]">No invites waiting</p>
      <p className="mt-1 text-sm text-muted">New game invites will appear here until you respond.</p>
    </div>
  );
}

function rsvpLabel(rsvp: GameCollectionItem["viewerRsvp"]) {
  if (rsvp === "pending") return "Awaiting approval";
  if (rsvp === "waitlisted") return "Waitlisted";
  if (rsvp === "maybe") return "Maybe";
  if (rsvp === "going") return "Going";
  return null;
}

function InvitationSection({
  items,
  onResponded,
}: {
  items: GameCollectionItem[];
  onResponded: (game: GameCollectionItem, response: ActiveInviteResponse) => void;
}) {
  return (
    <section aria-labelledby="game-invites-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="game-invites-heading" className="text-lg font-[680]">
          Invites
        </h2>
        {items.length ? <span className="score text-sm text-muted">{items.length}</span> : null}
      </div>
      {items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((game) => (
            <GameInvitationCard key={game.id} game={game} source="games" onResponded={onResponded} />
          ))}
        </div>
      ) : (
        <EmptyInvitations />
      )}
    </section>
  );
}

function GameList({ items, past = false }: { items: GameCollectionItem[]; past?: boolean }) {
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
              {past ? (
                <span className="sm:hidden"> · Ended</span>
              ) : rsvpLabel(game.viewerRsvp) ? (
                <span className="sm:hidden"> · {rsvpLabel(game.viewerRsvp)}</span>
              ) : null}
            </p>
          </div>
          {past ? (
            <span className="hidden text-xs font-[650] text-muted sm:block">Ended</span>
          ) : game.readiness ? (
            <span
              className={`hidden text-xs font-[650] sm:block ${game.readiness.ready ? "text-success" : "text-muted"}`}
            >
              {game.readiness.ready ? "Ready" : `${game.readiness.percent}% ready`}
            </span>
          ) : (
            <span className="hidden text-right sm:block">
              {rsvpLabel(game.viewerRsvp) ? (
                <span className="block text-xs font-[650] text-primary">{rsvpLabel(game.viewerRsvp)}</span>
              ) : null}
              <span className="score mt-0.5 block text-sm text-muted">
                {game.playerCount} / {game.capacity}
              </span>
            </span>
          )}
          <CaretRight aria-hidden size={16} className="text-muted transition-transform group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}

function GameGrid({ items, past = false }: { items: GameCollectionItem[]; past?: boolean }) {
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
              <span className="text-right">
                {past ? (
                  <span className="block text-xs font-[650] text-muted">Ended</span>
                ) : rsvpLabel(game.viewerRsvp) ? (
                  <span className="block text-xs font-[650] text-primary">{rsvpLabel(game.viewerRsvp)}</span>
                ) : null}
                <span className="score mt-0.5 block text-xs text-muted">
                  {game.playerCount} {past ? "played" : `/ ${game.capacity}`}
                </span>
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
            {game.readiness && !past ? (
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
          <GameGrid items={items} past={past} />
        ) : (
          <GameList items={items} past={past} />
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
  invitationPage = emptyInvitationPage,
  pastPage,
  todayKey,
  initialFilter = "upcoming",
  initialMonth = todayKey.slice(0, 7),
  initialDate = todayKey,
}: {
  upcomingPage: GameCollectionPage;
  invitationPage?: GameInvitationPage;
  pastPage: GameCollectionPage;
  todayKey: string;
  initialFilter?: GameFilter;
  initialMonth?: string;
  initialDate?: string;
}) {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  const weekStart = useSyncExternalStore(subscribe, getWeekStart, (): "sunday" | "monday" => "sunday");
  const [filter, setFilter] = useState<GameFilter>(initialFilter);
  const [invitations, setInvitations] = useState(invitationPage.items);
  const [upcoming, setUpcoming] = useState(upcomingPage.items);
  const [past, setPast] = useState(pastPage.items);
  const [responseAnnouncement, setResponseAnnouncement] = useState("");
  const [upcomingCursor, setUpcomingCursor] = useState(upcomingPage.nextCursor);
  const [pastCursor, setPastCursor] = useState(pastPage.nextCursor);
  const [loadingPhase, setLoadingPhase] = useState<GameCollectionPhase | null>(null);
  const [pageErrors, setPageErrors] = useState<Partial<Record<GameCollectionPhase, string>>>({});
  const loadingPhaseRef = useRef<GameCollectionPhase | null>(null);
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarData, setCalendarData] = useState<CalendarPage | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarRetry, setCalendarRetry] = useState(0);
  const calendarCache = useRef(new Map<string, CalendarPage>());
  const calendarEnabled = filter !== "invites";

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
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const nextMonth = validMonth(params.get("month")) ? params.get("month")! : todayKey.slice(0, 7);
      const requestedDate = params.get("date");
      const nextDate =
        validDate(requestedDate) && requestedDate.startsWith(nextMonth) ? requestedDate : `${nextMonth}-01`;
      const requestedFilter = params.get("filter");
      setFilter(requestedFilter === "invites" ? "invites" : requestedFilter === "past" ? "past" : "upcoming");
      setMonthKey(nextMonth);
      setSelectedDate(nextDate);
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [todayKey]);

  useEffect(() => {
    if (mode !== "calendar" || !calendarEnabled) return;
    const controller = new AbortController();
    const cached = calendarCache.current.get(monthKey);
    setCalendarData(cached ?? null);
    setCalendarLoading(true);
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
        calendarCache.current.set(monthKey, parsed.data);
        setCalendarData(parsed.data);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setCalendarError(cause instanceof Error ? cause.message : "This month could not be loaded.");
      })
      .finally(() => {
        if (!controller.signal.aborted) setCalendarLoading(false);
      });
    return () => controller.abort();
  }, [calendarEnabled, calendarRetry, mode, monthKey]);

  const handleInviteResponse = useCallback((game: GameCollectionItem, response: ActiveInviteResponse) => {
    setInvitations((current) => current.filter((item) => item.id !== game.id));
    setResponseAnnouncement(
      response === "declined"
        ? `You declined ${game.title}.`
        : response === "pending"
          ? `Your request to join ${game.title} was sent.`
          : response === "waitlisted"
            ? `You joined the waitlist for ${game.title}.`
            : `Your response to ${game.title} was saved.`,
    );
    if (response !== "declined")
      setUpcoming((current) => {
        if (current.some((item) => item.id === game.id)) return current;
        return [...current, { ...game, viewerRsvp: response }].toSorted(
          (left, right) => left.dateKey.localeCompare(right.dateKey) || left.title.localeCompare(right.title),
        );
      });
  }, []);

  const liveGames = upcoming.filter((game) => game.status === "live");
  const scheduledGames = upcoming.filter((game) => game.status !== "live");
  const filterItems = [
    { value: "upcoming" as const, label: "Upcoming" },
    { value: "invites" as const, label: invitations.length ? `Invites ${invitations.length}` : "Invites" },
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
  const handleFilterChange = (nextFilter: GameFilter) => {
    setFilter(nextFilter);
    updateGamesUrl({ filter: nextFilter }, "push");
  };
  const handleMonthChange = (nextMonth: string, nextDate: string) => {
    setMonthKey(nextMonth);
    setSelectedDate(nextDate);
    updateGamesUrl({ month: nextMonth, date: nextDate }, "push");
  };
  const handleDateSelect = (nextDate: string) => {
    setSelectedDate(nextDate);
    updateGamesUrl({ month: nextDate.slice(0, 7), date: nextDate });
  };

  return (
    <div className="mt-2 sm:mt-3">
      <div className="mb-6 pb-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="min-w-0 flex-1">
            <TabChipRail
              label="Filter games"
              items={filterItems}
              value={filter}
              onChange={handleFilterChange}
              className="min-w-0"
            />
          </div>
          {filter !== "invites" ? (
            <span className="hidden shrink-0 sm:block">
              <GameDesktopViewControls />
            </span>
          ) : null}
          <span className="hidden shrink-0 sm:block">
            <ButtonLink href="/games/new">
              <CalendarPlus aria-hidden size={17} />
              Create game
            </ButtonLink>
          </span>
        </div>
      </div>
      <p className="sr-only" aria-live="polite">
        {responseAnnouncement}
      </p>
      <div className="space-y-10 sm:space-y-12">
        {filter === "invites" || (filter === "upcoming" && invitations.length) ? (
          <InvitationSection items={invitations} onResponded={handleInviteResponse} />
        ) : null}
        {filter !== "invites" ? (
          mode === "calendar" ? (
            <div data-testid="games-calendar">
              <GamesCalendar
                upcoming={filter === "past" ? [] : (calendarData?.upcoming ?? [])}
                past={filter === "upcoming" ? [] : (calendarData?.past ?? [])}
                todayKey={todayKey}
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
          ) : (
            <div data-testid={mode === "grid" ? "games-grid" : "games-list"} className="space-y-10 sm:space-y-12">
              {filter === "upcoming" && liveGames.length ? (
                <CollectionSection title="Live now" items={liveGames} mode={mode} live />
              ) : null}
              {filter === "upcoming" && (scheduledGames.length || !liveGames.length || upcomingCursor) ? (
                <CollectionSection title="Upcoming" items={scheduledGames} mode={mode} footer={upcomingFooter} />
              ) : null}
              {filter === "past" ? (
                <CollectionSection title="Past games" items={past} mode={mode} past footer={pastFooter} />
              ) : null}
            </div>
          )
        ) : null}
      </div>
    </div>
  );
}
