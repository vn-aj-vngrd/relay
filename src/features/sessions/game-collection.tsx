"use client";

import {
  ArrowClockwise,
  CalendarBlank,
  CaretRight,
  MapPin,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { z } from "zod";
import { ButtonLink } from "@/components/ui/button";
import { sessionAccentStyle } from "./accent";
import type {
  GameCollectionItem,
  GameCollectionPage,
  GameCollectionPhase,
  GameInvitationPage,
} from "./game-collection-types";
import type { ActiveInviteResponse } from "./game-invitation-card";
import { GameInvitationCard } from "./game-invitation-card";
import { GameLibraryControls } from "./game-library-controls";
import {
  defaultGameLibraryFilters,
  type GameLibraryFilters,
  type GameLibraryOptions,
  gameLibraryRangeError,
  gameLibrarySearchParams,
} from "./game-library-filters";
import { GameResults, GameResultsTransition } from "./game-results-transition";
import { GameStatusChip } from "./game-status";
import { GamesCalendar } from "./games-calendar";
import { InvitationHistoryItems } from "./invitation-history-items";
import { playSetupNextAction } from "./readiness";

export type { GameCollectionItem } from "./game-collection-types";
export { GameViewMenu } from "./game-view-menu";

type ViewMode = "list" | "grid" | "calendar";
type GameFilter = GameLibraryFilters["when"] | "invites";
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
  viewerRsvp: z.enum([
    "invited",
    "pending",
    "going",
    "maybe",
    "waitlisted",
    "declined",
  ]),
  invitedAt: z.string(),
  hostName: z.string(),
  playerPriceCents: z.number().nullable(),
  requiresApproval: z.boolean(),
  spotsRemaining: z.number(),
  canReplay: z.boolean(),
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
const gamePageSchema = z.object({
  items: z.array(gameItemSchema),
  nextCursor: z.string().nullable(),
});
const calendarPageSchema = z.object({
  upcoming: z.array(gameItemSchema),
  past: z.array(gameItemSchema),
});
type CalendarPage = z.infer<typeof calendarPageSchema>;

function validMonth(value: string | null): value is string {
  return Boolean(value && /^\d{4}-(0[1-9]|1[0-2])$/.test(value));
}

function validDate(value: string | null): value is string {
  if (!value || !/^\d{4}-(0[1-9]|1[0-2])-([0-2]\d|3[01])$/.test(value))
    return false;
  const date = new Date(`${value}T00:00:00Z`);
  return (
    !Number.isNaN(date.getTime()) && date.toISOString().slice(0, 10) === value
  );
}

function updateGamesUrl(
  values: { month?: string; date?: string },
  behavior: "push" | "replace" = "replace"
) {
  const url = new URL(window.location.href);
  if (values.month) url.searchParams.set("month", values.month);
  if (values.date) url.searchParams.set("date", values.date);
  window.history[behavior === "push" ? "pushState" : "replaceState"](
    null,
    "",
    `${url.pathname}?${url.searchParams}`
  );
}

function getView(): ViewMode {
  const saved = localStorage.getItem(preferenceKey);
  return saved === "grid" || saved === "calendar" ? saved : "list";
}

function getWeekStart(): "sunday" | "monday" {
  return localStorage.getItem("relay-week-start") === "monday"
    ? "monday"
    : "sunday";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === preferenceKey || event.key === "relay-week-start")
      callback();
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
    if (!target || !nextCursor || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void onLoad(phase);
      },
      {
        root: target.closest<HTMLElement>(".app-scroll-surface"),
        rootMargin: "480px 0px",
      }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [nextCursor, onLoad, phase]);

  if (!nextCursor && !loading && !error) return null;
  return (
    <div ref={sentinel} className="min-h-14">
      {loading ? (
        <p
          role="status"
          className="flex items-center justify-center gap-2 py-5 text-sm text-muted"
        >
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none" />
          Loading more {phase === "upcoming" ? "upcoming" : "past"} games…
        </p>
      ) : null}
      {error ? (
        <div
          role="alert"
          className="flex items-center justify-center gap-3 py-4 text-sm text-muted"
        >
          <span>{error}</span>
          <button
            type="button"
            onClick={() => void onLoad(phase)}
            className="font-semibold text-primary"
          >
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
      <p className="font-[650]">
        {past ? "No game memories yet" : "Nothing scheduled"}
      </p>
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
      <p className="mt-1 text-sm text-muted">
        New game invites will appear here until you respond.
      </p>
    </div>
  );
}

function rsvpLabel(rsvp: GameCollectionItem["viewerRsvp"]) {
  if (rsvp === "pending") return "Awaiting approval";
  if (rsvp === "waitlisted") return "Waitlisted";
  if (rsvp === "maybe") return "Maybe";
  if (rsvp === "going") return "Going";
  if (rsvp === "declined") return "Declined";
  return null;
}

function InvitationSection({
  items,
  onResponded,
}: {
  items: GameCollectionItem[];
  onResponded: (
    game: GameCollectionItem,
    response: ActiveInviteResponse
  ) => void;
}) {
  return (
    <section aria-labelledby="game-invites-heading">
      <div className="mb-3 flex items-baseline justify-between gap-3">
        <h2 id="game-invites-heading" className="text-lg font-[680]">
          Invites
        </h2>
        {items.length ? (
          <span className="score text-sm text-muted">{items.length}</span>
        ) : null}
      </div>
      {items.length ? (
        <div className="grid gap-3 lg:grid-cols-2">
          {items.map((game) => (
            <GameInvitationCard
              key={game.id}
              game={game}
              source="games"
              onResponded={onResponded}
            />
          ))}
        </div>
      ) : (
        <EmptyInvitations />
      )}
    </section>
  );
}

function ReplayGameLink({
  game,
  compact = false,
}: {
  game: GameCollectionItem;
  compact?: boolean;
}) {
  return (
    <ButtonLink
      href={`/games/new?from=${game.id}`}
      variant="quiet"
      aria-label={`Play ${game.title} again`}
      className={
        compact
          ? "h-11 min-h-11 w-11 shrink-0 px-0 sm:w-auto sm:px-3"
          : "w-full"
      }
    >
      <ArrowClockwise aria-hidden size={16} />
      <span className={compact ? "sr-only sm:not-sr-only" : ""}>
        Play again
      </span>
    </ButtonLink>
  );
}

function GameList({
  items,
  past = false,
}: {
  items: GameCollectionItem[];
  past?: boolean;
}) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((game) => (
        <div
          key={game.id}
          style={sessionAccentStyle(game.accentColor)}
          className="collection-row game-list-item flex min-h-[4.5rem] items-center gap-1 sm:min-h-20 sm:gap-2 sm:px-1"
        >
          <Link
            href={game.href}
            prefetch={false}
            className="pressable group flex min-w-0 flex-1 items-center gap-3 py-3.5 hover:bg-surface sm:gap-4 sm:px-2 sm:py-4"
          >
            <time className="score hidden w-20 shrink-0 text-sm font-bold text-primary sm:block">
              {game.date}
            </time>
            <div className="min-w-0 flex-1">
              <div className="flex min-w-0 items-center gap-2">
                <h3 className="min-w-0 truncate font-[650]">{game.title}</h3>
                <GameStatusChip status={game.status} endsAt={game.endsAt} />
              </div>
              <p className="mt-1 truncate text-[13px] text-muted sm:text-sm">
                <time className="score font-bold text-primary sm:hidden">
                  {game.date}
                </time>
                <span className="sm:hidden"> · </span>
                {game.time} · {game.venue}
                {!past && rsvpLabel(game.viewerRsvp) ? (
                  <span className="sm:hidden">
                    {" "}
                    · {rsvpLabel(game.viewerRsvp)}
                  </span>
                ) : null}
              </p>
            </div>
            {past ? null : game.readiness && game.status !== "live" ? (
              <span
                className={`hidden text-xs font-[650] sm:block ${game.readiness.ready ? "text-success" : "text-muted"}`}
              >
                {playSetupNextAction(game.readiness)}
              </span>
            ) : (
              <span className="hidden text-right sm:block">
                {rsvpLabel(game.viewerRsvp) ? (
                  <span className="block text-xs font-[650] text-primary">
                    {rsvpLabel(game.viewerRsvp)}
                  </span>
                ) : null}
                <span className="score mt-0.5 block text-sm text-muted">
                  {game.playerCount} / {game.capacity}
                </span>
              </span>
            )}
            <CaretRight
              aria-hidden
              size={16}
              className="text-muted transition-transform group-hover:translate-x-0.5"
            />
          </Link>
          {past && game.canReplay ? (
            <ReplayGameLink game={game} compact />
          ) : null}
        </div>
      ))}
    </div>
  );
}

function GameGrid({
  items,
  past = false,
}: {
  items: GameCollectionItem[];
  past?: boolean;
}) {
  return (
    <div className="grid gap-3 min-[380px]:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {items.map((game) => (
        <article
          key={game.id}
          style={sessionAccentStyle(game.accentColor)}
          className="game-grid-item flex min-w-0 flex-col rounded-lg border border-line bg-surface p-3.5 hover:border-primary/35 sm:p-5"
        >
          <Link
            href={game.href}
            prefetch={false}
            className="pressable group flex min-w-0 flex-1 flex-col"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <time className="score text-xs font-bold text-primary">
                {game.date}
              </time>
              <GameStatusChip status={game.status} endsAt={game.endsAt} />
            </div>
            <h3 className="mt-3 line-clamp-2 text-[15px] font-[680] leading-5 group-hover:text-primary sm:mt-5 sm:truncate sm:text-lg sm:leading-normal">
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
            <div className="mt-4 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-1 text-xs">
              {!past && rsvpLabel(game.viewerRsvp) ? (
                <span className="font-[650] text-primary">
                  {rsvpLabel(game.viewerRsvp)}
                </span>
              ) : null}
              <span className="score ml-auto text-right text-muted">
                {game.playerCount}{" "}
                {past ? "Going responses" : `/ ${game.capacity} players`}
              </span>
            </div>
            {game.readiness && !past && game.status !== "live" ? (
              <p className="mt-3 text-xs font-semibold text-muted sm:mt-5">
                {playSetupNextAction(game.readiness)}
              </p>
            ) : null}
            <span className="mt-auto hidden items-center gap-1 pt-6 text-sm font-[650] text-primary sm:inline-flex">
              Open game{" "}
              <CaretRight
                aria-hidden
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </Link>
          {past && game.canReplay ? (
            <div className="mt-4 border-t border-line pt-3">
              <ReplayGameLink game={game} />
            </div>
          ) : null}
        </article>
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
  children,
}: {
  children?: React.ReactNode;
  title: string;
  items: GameCollectionItem[];
  mode: Exclude<ViewMode, "calendar">;
  past?: boolean;
  live?: boolean;
  footer?: React.ReactNode;
}) {
  return (
    <section>
      <h2
        className={`mb-3 flex items-center gap-2 text-lg font-[680] ${live ? "text-live" : ""}`}
      >
        {live ? (
          <span aria-hidden className="h-2 w-2 rounded-full bg-live" />
        ) : null}
        {title}
      </h2>
      {children ??
        (items.length ? (
          mode === "grid" ? (
            <GameGrid items={items} past={past} />
          ) : (
            <GameList items={items} past={past} />
          )
        ) : (
          <EmptyCollection past={past} />
        ))}
      {footer}
    </section>
  );
}

type GameCollectionProps = {
  upcomingPage: GameCollectionPage;
  invitationPage?: GameInvitationPage;
  pastPage: GameCollectionPage;
  todayKey: string;
  initialFilter?: GameFilter;
  initialMonth?: string;
  initialDate?: string;
  filters?: GameLibraryFilters;
  options?: GameLibraryOptions;
  filterError?: string;
  hasInvitationHistory?: boolean;
};

export function GameCollection(props: GameCollectionProps) {
  const filters = props.filters ?? {
    ...defaultGameLibraryFilters,
    when: props.initialFilter === "past" ? "past" : "upcoming",
  };
  return (
    <GameResultsTransition>
      <GameLibraryControls
        filters={filters}
        options={props.options}
        error={props.filterError}
      />
      <GameResults invitations={filters.collection === "invitations"}>
        <GameCollectionResults
          key={`${gameLibrarySearchParams(filters)}:${props.initialFilter === "invites"}:${props.filterError ?? ""}`}
          {...props}
          filters={filters}
        />
      </GameResults>
    </GameResultsTransition>
  );
}

function GameCollectionResults({
  upcomingPage,
  invitationPage = emptyInvitationPage,
  pastPage,
  todayKey,
  initialFilter = "upcoming",
  initialMonth = todayKey.slice(0, 7),
  initialDate = todayKey,
  filters = defaultGameLibraryFilters,
  filterError,
  hasInvitationHistory = true,
}: GameCollectionProps) {
  const router = useRouter();
  const invitationHistory = filters.collection === "invitations";
  const defaultInvitations =
    invitationHistory &&
    filters.response === "invited" &&
    filters.when === "upcoming" &&
    !filters.q;
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  const weekStart = useSyncExternalStore(
    subscribe,
    getWeekStart,
    (): "sunday" | "monday" => "sunday"
  );
  const [showInvites, setShowInvites] = useState(initialFilter === "invites");
  const [invitations, setInvitations] = useState(invitationPage.items);
  const [previousInvitationItems, setPreviousInvitationItems] = useState(
    invitationPage.items
  );
  // Preserve the refreshed-invitation reconciliation from the existing workspace edits.
  if (previousInvitationItems !== invitationPage.items) {
    setPreviousInvitationItems(invitationPage.items);
    setInvitations(invitationPage.items);
  }
  const [pages, setPages] = useState({
    upcoming: upcomingPage,
    past: pastPage,
  });
  const [previousPages, setPreviousPages] = useState({
    upcoming: upcomingPage,
    past: pastPage,
  });
  if (
    previousPages.upcoming !== upcomingPage ||
    previousPages.past !== pastPage
  ) {
    setPreviousPages({ upcoming: upcomingPage, past: pastPage });
    setPages({ upcoming: upcomingPage, past: pastPage });
  }
  const [responseAnnouncement, setResponseAnnouncement] = useState("");
  const [loadingPhase, setLoadingPhase] = useState<GameCollectionPhase | null>(
    null
  );
  const [pageErrors, setPageErrors] = useState<
    Partial<Record<GameCollectionPhase, string>>
  >({});
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), []);
  const query = gameLibrarySearchParams(filters).toString();
  const [monthKey, setMonthKey] = useState(initialMonth);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [calendarData, setCalendarData] = useState<CalendarPage | null>(null);
  const [calendarLoading, setCalendarLoading] = useState(false);
  const [calendarError, setCalendarError] = useState<string | null>(null);
  const [calendarRetry, setCalendarRetry] = useState(0);
  const invalid = Boolean(filterError || gameLibraryRangeError(filters));

  const loadMore = useCallback(
    async (phase: GameCollectionPhase) => {
      const cursor = pages[phase].nextCursor;
      if (!cursor || requestRef.current) return;
      const controller = new AbortController();
      requestRef.current = controller;
      setLoadingPhase(phase);
      setPageErrors((current) => ({ ...current, [phase]: undefined }));
      try {
        const params = new URLSearchParams(query);
        params.set("phase", phase);
        params.set("cursor", cursor);
        const response = await fetch(`/api/games?${params}`, {
          credentials: "same-origin",
          headers: { Accept: "application/json" },
          signal: controller.signal,
        });
        if (!response.ok)
          throw new Error(
            response.status === 429
              ? "Loading is temporarily limited. Try again shortly."
              : "More games could not be loaded."
          );
        const parsed = gamePageSchema.safeParse(await response.json());
        if (!parsed.success)
          throw new Error("The server returned an invalid game page.");
        if (controller.signal.aborted) return;
        setPages((current) => {
          if (current !== pages) return current;
          const ids = new Set(current[phase].items.map((item) => item.id));
          return {
            ...current,
            [phase]: {
              items: [
                ...current[phase].items,
                ...parsed.data.items.filter((item) => !ids.has(item.id)),
              ],
              nextCursor: parsed.data.nextCursor,
            },
          };
        });
      } catch (cause) {
        if (!controller.signal.aborted)
          setPageErrors((current) => ({
            ...current,
            [phase]:
              cause instanceof Error
                ? cause.message
                : "More games could not be loaded.",
          }));
      } finally {
        if (!controller.signal.aborted) {
          requestRef.current = null;
          setLoadingPhase(null);
        }
      }
    },
    [pages, query]
  );

  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const month = params.get("month");
      const nextMonth = validMonth(month) ? month : todayKey.slice(0, 7);
      const date = params.get("date");
      setMonthKey(nextMonth);
      setSelectedDate(
        validDate(date) && date.startsWith(nextMonth) ? date : `${nextMonth}-01`
      );
      setShowInvites(params.get("filter") === "invites");
    };
    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, [todayKey]);

  useEffect(() => {
    if (mode !== "calendar" || showInvites || invalid) return;
    const controller = new AbortController();
    setCalendarData(null);
    setCalendarLoading(true);
    setCalendarError(null);
    const params = new URLSearchParams(query);
    params.set("month", monthKey);
    void fetch(`/api/games?${params}`, {
      credentials: "same-origin",
      headers: { Accept: "application/json" },
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error("This month could not be loaded.");
        const parsed = calendarPageSchema.safeParse(await response.json());
        if (!parsed.success)
          throw new Error("The server returned invalid calendar data.");
        if (!controller.signal.aborted) setCalendarData(parsed.data);
      })
      .catch((cause: unknown) => {
        if (!controller.signal.aborted)
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
  }, [
    calendarRetry,
    invalid,
    mode,
    monthKey,
    pastPage,
    query,
    showInvites,
    upcomingPage,
  ]);

  const handleInviteResponse = useCallback(
    (game: GameCollectionItem, response: ActiveInviteResponse) => {
      setInvitations((current) =>
        current.filter((item) => item.id !== game.id)
      );
      if (invitationHistory) {
        setPages((current) => {
          const reconcile = (page: GameCollectionPage) => ({
            ...page,
            items: page.items.flatMap((item) =>
              item.id !== game.id
                ? [item]
                : filters.response === "any" || filters.response === response
                  ? [{ ...item, viewerRsvp: response }]
                  : []
            ),
          });
          return {
            upcoming: reconcile(current.upcoming),
            past: reconcile(current.past),
          };
        });
      }
      setResponseAnnouncement(
        response === "declined"
          ? `You declined ${game.title}.`
          : response === "pending"
            ? `Your request to join ${game.title} was sent.`
            : response === "waitlisted"
              ? `You joined the waitlist for ${game.title}.`
              : `Your response to ${game.title} was saved.`
      );
      // Never append an answered invitation to a filtered page locally: the server
      // re-evaluates membership, response, capacity, order, and all library filters.
      setCalendarRetry((value) => value + 1);
      router.refresh();
    },
    [router, invitationHistory, filters.response]
  );
  const liveGames = pages.upcoming.items.filter(
    (game) => game.status === "live"
  );
  const scheduledGames = pages.upcoming.items.filter(
    (game) => game.status !== "live"
  );
  const footer = (phase: GameCollectionPhase) => (
    <GamePageSentinel
      phase={phase}
      nextCursor={pages[phase].nextCursor}
      loading={loadingPhase === phase}
      error={pageErrors[phase] ?? null}
      onLoad={loadMore}
    />
  );
  const empty = !pages.upcoming.items.length && !pages.past.items.length;
  const toggleInvites = () => {
    const next = !showInvites;
    setShowInvites(next);
    const url = new URL(window.location.href);
    if (next) url.searchParams.set("filter", "invites");
    else url.searchParams.delete("filter");
    window.history.pushState(null, "", `${url.pathname}?${url.searchParams}`);
  };
  return (
    <div className="mt-2 sm:mt-3">
      <div className="mb-6 flex flex-wrap items-center gap-3 empty:hidden">
        {invitations.length || showInvites ? (
          <button
            type="button"
            aria-pressed={showInvites}
            onClick={toggleInvites}
            className="min-h-9 rounded-full border border-line bg-surface px-3 text-[13px] font-semibold hover:bg-surface-strong"
          >
            {invitations.length ? `Invites ${invitations.length}` : "Invites"}
          </button>
        ) : null}
        {showInvites ? (
          <button
            type="button"
            className="min-h-9 px-3 text-sm font-semibold text-primary"
            onClick={toggleInvites}
          >
            Back to your games
          </button>
        ) : null}
      </div>
      <p className="sr-only" aria-live="polite">
        {responseAnnouncement}
      </p>
      {showInvites ? (
        <InvitationSection
          items={invitations}
          onResponded={handleInviteResponse}
        />
      ) : invalid ? null : mode === "calendar" ? (
        <div data-testid="games-calendar">
          <GamesCalendar
            upcoming={calendarData?.upcoming ?? []}
            past={calendarData?.past ?? []}
            todayKey={todayKey}
            weekStart={weekStart}
            monthKey={monthKey}
            selectedDate={selectedDate}
            loading={calendarLoading}
            error={calendarError}
            onMonthChange={(month, date) => {
              setMonthKey(month);
              setSelectedDate(date);
              updateGamesUrl({ month, date }, "push");
            }}
            onSelectDate={(date) => {
              setSelectedDate(date);
              updateGamesUrl({ month: date.slice(0, 7), date });
            }}
            onRetry={() => setCalendarRetry((value) => value + 1)}
          />
        </div>
      ) : (
        <div
          data-testid={mode === "grid" ? "games-grid" : "games-list"}
          className="space-y-10 sm:space-y-12"
        >
          {empty ? (
            <section className="py-9">
              <h2 className="text-lg font-bold">
                {invitationHistory
                  ? !hasInvitationHistory
                    ? "No invitations yet"
                    : defaultInvitations
                      ? "No invitations waiting"
                      : "No invitations match these filters"
                  : query
                    ? "No games match your filters"
                    : "No upcoming games yet"}
              </h2>
              <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
                {invitationHistory
                  ? defaultInvitations || !hasInvitationHistory
                    ? "New invitations will appear here."
                    : "Try another response, date, or search."
                  : query
                    ? "Try another date, role, or search."
                    : "Create a game or find one in Open games."}
              </p>
              {!defaultInvitations ? (
                <ButtonLink
                  href={
                    invitationHistory
                      ? "/games/invitations"
                      : query
                        ? "/games"
                        : "/games/new"
                  }
                  className="mt-4"
                >
                  {query ? "Clear filters" : "Create game"}
                </ButtonLink>
              ) : null}
            </section>
          ) : null}
          {liveGames.length ? (
            <CollectionSection
              title="Live now"
              items={liveGames}
              mode={mode}
              live
            >
              {invitationHistory ? (
                <InvitationHistoryItems
                  items={liveGames}
                  mode={mode}
                  onResponded={handleInviteResponse}
                />
              ) : undefined}
            </CollectionSection>
          ) : null}
          {scheduledGames.length || pages.upcoming.nextCursor ? (
            <CollectionSection
              title="Upcoming"
              items={scheduledGames}
              mode={mode}
              footer={footer("upcoming")}
            >
              {invitationHistory ? (
                <InvitationHistoryItems
                  items={scheduledGames}
                  mode={mode}
                  onResponded={handleInviteResponse}
                />
              ) : undefined}
            </CollectionSection>
          ) : liveGames.length ? (
            footer("upcoming")
          ) : null}
          {pages.past.items.length || pages.past.nextCursor ? (
            <CollectionSection
              title="Past games"
              items={pages.past.items}
              mode={mode}
              past
              footer={footer("past")}
            >
              {invitationHistory ? (
                <InvitationHistoryItems
                  items={pages.past.items}
                  mode={mode}
                  onResponded={handleInviteResponse}
                />
              ) : undefined}
            </CollectionSection>
          ) : null}
        </div>
      )}
    </div>
  );
}
