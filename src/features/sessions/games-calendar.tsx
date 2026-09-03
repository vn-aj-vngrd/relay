"use client";

import {
  ArrowClockwise,
  CaretLeft,
  CaretRight,
  MapPin,
  Users,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef } from "react";

import { ButtonLink } from "@/components/ui/button";

import { sessionAccentStyle } from "./accent";
import type { GameCollectionItem } from "./game-collection-types";

type CalendarPhase = "live" | "upcoming" | "past";
type CalendarGame = GameCollectionItem & { phase: CalendarPhase };
type WeekStart = "sunday" | "monday";

export type CalendarDay = {
  dateKey: string;
  day: number;
  inMonth: boolean;
};

const monthTitleFormatter = new Intl.DateTimeFormat("en-PH", {
  month: "long",
  year: "numeric",
  timeZone: "UTC",
});
const fullDateFormatter = new Intl.DateTimeFormat("en-PH", {
  weekday: "long",
  month: "long",
  day: "numeric",
  year: "numeric",
  timeZone: "UTC",
});
const weekdayLabels = {
  sunday: ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"],
  monday: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
} as const;

function dateFromKey(dateKey: string) {
  return new Date(`${dateKey}T00:00:00Z`);
}

function keyFromDate(date: Date) {
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

export function shiftDateKey(dateKey: string, days: number) {
  const date = dateFromKey(dateKey);
  date.setUTCDate(date.getUTCDate() + days);
  return keyFromDate(date);
}

export function buildCalendarDays(
  monthKey: string,
  weekStart: WeekStart
): CalendarDay[] {
  const month = dateFromKey(`${monthKey}-01`);
  const monthIndex = month.getUTCMonth();
  const firstDayOffset =
    weekStart === "monday" ? (month.getUTCDay() + 6) % 7 : month.getUTCDay();
  const gridStart = new Date(
    Date.UTC(month.getUTCFullYear(), monthIndex, 1 - firstDayOffset)
  );

  return Array.from({ length: 42 }, (_, index) => {
    const date = new Date(gridStart);
    date.setUTCDate(gridStart.getUTCDate() + index);
    return {
      dateKey: keyFromDate(date),
      day: date.getUTCDate(),
      inMonth: date.getUTCMonth() === monthIndex,
    };
  });
}

function shortTime(time: string) {
  const [start, end] = time.split("–");
  if (!start) return time;
  if (/\b(?:AM|PM)\b/i.test(start)) return start;
  const period = end?.match(/\b(?:AM|PM)\b/i)?.[0];
  return period ? `${start} ${period}` : start;
}

function phaseLabel(phase: CalendarPhase) {
  if (phase === "live") return "Live";
  if (phase === "past") return "Ended";
  return "Upcoming";
}

function gameTone(phase: CalendarPhase) {
  if (phase === "live") return "bg-live/12 text-live hover:bg-live/18";
  if (phase === "past") return "bg-surface-strong text-muted hover:text-ink";
  return "bg-primary-soft text-primary hover:bg-primary-soft/75";
}

function DayAgenda({
  dateKey,
  games,
  loading,
}: {
  dateKey: string;
  games: CalendarGame[];
  loading: boolean;
}) {
  const title = fullDateFormatter.format(dateFromKey(dateKey));

  return (
    <aside
      aria-labelledby="selected-day-heading"
      className="min-w-0 lg:sticky lg:top-4 lg:self-start"
    >
      <div className="border-b border-line pb-3">
        <h3 id="selected-day-heading" className="text-base font-[680]">
          {title}
        </h3>
        <p className="mt-1 text-[13px] text-muted">
          {loading
            ? "Updating games…"
            : `${games.length} ${games.length === 1 ? "game" : "games"}`}
        </p>
      </div>

      {games.length ? (
        <div className="divide-y divide-line" aria-label={`Games on ${title}`}>
          {games.map((game) => (
            <article
              key={game.id}
              style={sessionAccentStyle(game.accentColor)}
              className="py-4"
            >
              <Link
                href={game.href}
                prefetch={false}
                className="pressable group block"
              >
                <div className="flex min-w-0 items-center gap-2">
                  <span
                    aria-hidden
                    className="h-2 w-2 shrink-0 rounded-full bg-[var(--primary)]"
                  />
                  <span
                    className={`text-xs font-[680] ${game.phase === "live" ? "text-live" : "text-muted"}`}
                  >
                    {phaseLabel(game.phase)} · {shortTime(game.time)}
                  </span>
                </div>
                <p className="mt-1.5 line-clamp-2 font-[680] text-ink group-hover:text-primary">
                  {game.title}
                </p>
                <p className="mt-2 flex min-w-0 items-center gap-2 text-[13px] text-muted">
                  <MapPin aria-hidden size={15} className="shrink-0" />
                  <span className="truncate">{game.venue}</span>
                </p>
                <p className="mt-1.5 flex items-center gap-2 text-[13px] text-muted">
                  <Users aria-hidden size={15} className="shrink-0" />
                  <span className="score">
                    {game.phase === "past"
                      ? game.playerCount
                      : `${game.playerCount} / ${game.capacity}`}
                  </span>
                  <span>{game.phase === "past" ? "played" : "going"}</span>
                  {game.readiness && game.phase !== "past" ? (
                    <span
                      className={
                        game.readiness.ready
                          ? "font-[650] text-success"
                          : "text-muted"
                      }
                    >
                      ·{" "}
                      {game.readiness.ready
                        ? "Ready"
                        : `${game.readiness.percent}% ready`}
                    </span>
                  ) : null}
                </p>
              </Link>
              {game.phase === "past" && game.canReplay ? (
                <ButtonLink
                  href={`/games/new?from=${game.id}`}
                  variant="quiet"
                  aria-label={`Play ${game.title} again`}
                  className="mt-2 -ml-3"
                >
                  <ArrowClockwise aria-hidden size={15} /> Play again
                </ButtonLink>
              ) : null}
            </article>
          ))}
        </div>
      ) : loading ? (
        <div className="space-y-3 py-4" aria-hidden>
          <div className="h-16 animate-pulse rounded-lg bg-surface-strong motion-reduce:animate-none" />
          <div className="h-16 animate-pulse rounded-lg bg-surface-strong motion-reduce:animate-none" />
        </div>
      ) : (
        <div className="py-6">
          <p className="font-[650]">No games this day</p>
          <p className="mt-1 text-sm text-muted">
            Choose another date to view its games.
          </p>
        </div>
      )}
    </aside>
  );
}

function DesktopCalendar({
  days,
  gamesByDate,
  monthKey,
  selectedDate,
  todayKey,
  weekStart,
  onSelectDate,
  onMonthChange,
}: {
  days: CalendarDay[];
  gamesByDate: Map<string, CalendarGame[]>;
  monthKey: string;
  selectedDate: string;
  todayKey: string;
  weekStart: WeekStart;
  onSelectDate: (dateKey: string) => void;
  onMonthChange: (monthKey: string, selectedDate: string) => void;
}) {
  const focusDate = useRef<string | null>(null);
  const dateButtons = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (focusDate.current !== selectedDate) return;
    dateButtons.current.get(selectedDate)?.focus();
    focusDate.current = null;
  }, [selectedDate]);

  const moveSelection = (dateKey: string, amount: number) => {
    const nextDate = shiftDateKey(dateKey, amount);
    focusDate.current = nextDate;
    if (nextDate.slice(0, 7) !== monthKey)
      onMonthChange(nextDate.slice(0, 7), nextDate);
    else onSelectDate(nextDate);
  };

  return (
    <div className="hidden sm:block">
      <div
        role="row"
        className="grid grid-cols-7 border-x border-t border-line bg-surface-strong/55"
      >
        {weekdayLabels[weekStart].map((day) => (
          <div
            key={day}
            role="columnheader"
            className="py-2 text-center text-xs font-[650] text-muted"
          >
            {day}
          </div>
        ))}
      </div>
      <div
        role="grid"
        aria-label={monthTitleFormatter.format(dateFromKey(`${monthKey}-01`))}
        className="grid grid-cols-7 border-l border-t border-line"
      >
        {days.map((day) => {
          const dayGames = gamesByDate.get(day.dateKey) ?? [];
          const selected = day.dateKey === selectedDate;
          const today = day.dateKey === todayKey;
          const fullDate = fullDateFormatter.format(dateFromKey(day.dateKey));
          return (
            <div
              key={day.dateKey}
              role="gridcell"
              aria-selected={selected}
              className={`relative min-h-[7.5rem] min-w-0 border-b border-r border-line p-1.5 ${day.inMonth ? "bg-surface" : "bg-surface-strong/35"} ${selected ? "shadow-[inset_0_0_0_2px_var(--primary)]" : ""}`}
            >
              <button
                ref={(node) => {
                  if (node) dateButtons.current.set(day.dateKey, node);
                  else dateButtons.current.delete(day.dateKey);
                }}
                type="button"
                tabIndex={selected ? 0 : -1}
                aria-label={`${fullDate}, ${dayGames.length} ${dayGames.length === 1 ? "game" : "games"}`}
                aria-current={today ? "date" : undefined}
                onClick={() => {
                  if (!day.inMonth)
                    onMonthChange(day.dateKey.slice(0, 7), day.dateKey);
                  else onSelectDate(day.dateKey);
                }}
                onKeyDown={(event) => {
                  const weekday = dateFromKey(day.dateKey).getUTCDay();
                  const column =
                    weekStart === "monday" ? (weekday + 6) % 7 : weekday;
                  const amounts: Partial<Record<string, number>> = {
                    ArrowLeft: -1,
                    ArrowRight: 1,
                    ArrowUp: -7,
                    ArrowDown: 7,
                    Home: -column,
                    End: 6 - column,
                  };
                  const amount = amounts[event.key];
                  if (amount === undefined) return;
                  event.preventDefault();
                  moveSelection(day.dateKey, amount);
                }}
                className="pressable grid h-11 w-11 place-items-center rounded-lg text-xs font-[680] text-muted hover:bg-surface-strong hover:text-ink"
              >
                <time
                  dateTime={day.dateKey}
                  className={`grid h-7 w-7 place-items-center rounded-full ${today ? "bg-primary text-white" : selected ? "bg-primary-soft text-primary" : day.inMonth ? "" : "text-muted/65"}`}
                >
                  {day.day}
                </time>
              </button>
              <div className="mt-0.5 space-y-1">
                {dayGames.slice(0, 2).map((game) => (
                  <Link
                    key={game.id}
                    href={game.href}
                    prefetch={false}
                    style={sessionAccentStyle(game.accentColor)}
                    aria-label={`${phaseLabel(game.phase)}: ${game.title}, ${game.time}`}
                    className={`pressable flex min-h-7 min-w-0 items-center gap-1 rounded-md px-1.5 text-[11px] font-[650] ${gameTone(game.phase)}`}
                  >
                    <span
                      aria-hidden
                      className="h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--primary)]"
                    />
                    <span className="score shrink-0 text-[10px]">
                      {shortTime(game.time)}
                    </span>
                    <span className="truncate">
                      {game.phase === "live" ? "Live · " : ""}
                      {game.title}
                    </span>
                  </Link>
                ))}
                {dayGames.length > 2 ? (
                  <button
                    type="button"
                    onClick={() => onSelectDate(day.dateKey)}
                    className="pressable min-h-7 w-full rounded-md px-1.5 text-left text-[11px] font-[650] text-primary hover:bg-primary-soft"
                  >
                    {dayGames.length - 2} more
                  </button>
                ) : null}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function MobileCalendar({
  days,
  gamesByDate,
  selectedDate,
  todayKey,
  weekStart,
  onSelectDate,
  onMonthChange,
}: {
  days: CalendarDay[];
  gamesByDate: Map<string, CalendarGame[]>;
  selectedDate: string;
  todayKey: string;
  weekStart: WeekStart;
  onSelectDate: (dateKey: string) => void;
  onMonthChange: (monthKey: string, selectedDate: string) => void;
}) {
  return (
    <div className="sm:hidden">
      <div className="grid grid-cols-7">
        {weekdayLabels[weekStart].map((day) => (
          <div
            key={day}
            className="py-2 text-center text-[11px] font-[650] text-muted"
          >
            {day.slice(0, 1)}
          </div>
        ))}
      </div>
      <div className="grid grid-cols-7" role="group" aria-label="Choose a date">
        {days.map((day) => {
          const games = gamesByDate.get(day.dateKey) ?? [];
          const selected = day.dateKey === selectedDate;
          const today = day.dateKey === todayKey;
          return (
            <button
              key={day.dateKey}
              type="button"
              aria-pressed={selected}
              aria-current={today ? "date" : undefined}
              aria-label={`${fullDateFormatter.format(dateFromKey(day.dateKey))}, ${games.length} ${games.length === 1 ? "game" : "games"}`}
              onClick={() => {
                if (!day.inMonth)
                  onMonthChange(day.dateKey.slice(0, 7), day.dateKey);
                else onSelectDate(day.dateKey);
              }}
              className={`pressable flex min-h-12 min-w-0 flex-col items-center justify-center rounded-lg text-xs font-[680] ${selected ? "bg-primary-soft text-primary" : day.inMonth ? "text-ink hover:bg-surface-strong" : "text-muted/55 hover:bg-surface-strong"}`}
            >
              <time
                dateTime={day.dateKey}
                className={`grid h-6 w-6 place-items-center rounded-full ${today ? "bg-primary text-white" : ""}`}
              >
                {day.day}
              </time>
              <span
                aria-hidden
                className="mt-0.5 flex h-1.5 items-center gap-0.5"
              >
                {games.slice(0, 3).map((game) => (
                  <span
                    key={game.id}
                    className={`h-1 w-1 rounded-full ${game.phase === "live" ? "bg-live" : game.phase === "past" ? "bg-muted" : "bg-primary"}`}
                  />
                ))}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export function GamesCalendar({
  upcoming,
  past,
  todayKey,
  weekStart,
  monthKey,
  selectedDate,
  loading,
  error,
  onMonthChange,
  onSelectDate,
  onRetry,
}: {
  upcoming: GameCollectionItem[];
  past: GameCollectionItem[];
  todayKey: string;
  weekStart: WeekStart;
  monthKey: string;
  selectedDate: string;
  loading: boolean;
  error: string | null;
  onMonthChange: (monthKey: string, selectedDate: string) => void;
  onSelectDate: (dateKey: string) => void;
  onRetry: () => void;
}) {
  const days = useMemo(
    () => buildCalendarDays(monthKey, weekStart),
    [monthKey, weekStart]
  );
  const games = useMemo<CalendarGame[]>(
    () => [
      ...upcoming.map((game) => ({
        ...game,
        phase:
          game.status === "live" ? ("live" as const) : ("upcoming" as const),
      })),
      ...past.map((game) => ({ ...game, phase: "past" as const })),
    ],
    [past, upcoming]
  );
  const gamesByDate = useMemo(() => {
    const grouped = new Map<string, CalendarGame[]>();
    for (const game of games)
      grouped.set(game.dateKey, [...(grouped.get(game.dateKey) ?? []), game]);
    return grouped;
  }, [games]);
  const selectedGames = gamesByDate.get(selectedDate) ?? [];
  const month = dateFromKey(`${monthKey}-01`);
  const title = monthTitleFormatter.format(month);
  const changeMonth = (amount: number) => {
    const next = new Date(
      Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + amount, 1)
    );
    const nextMonth = keyFromDate(next).slice(0, 7);
    const nextDate =
      nextMonth === todayKey.slice(0, 7) ? todayKey : `${nextMonth}-01`;
    onMonthChange(nextMonth, nextDate);
  };

  return (
    <section aria-labelledby="calendar-month" aria-busy={loading}>
      <div className="mb-4 flex items-center justify-between gap-3">
        <div className="min-w-0">
          <h2
            id="calendar-month"
            className="truncate text-xl font-[680]"
            aria-live="polite"
          >
            {title}
          </h2>
          <p className="mt-1 text-[13px] text-muted">
            {loading
              ? "Updating…"
              : upcoming.length && past.length
                ? "Upcoming & completed"
                : past.length
                  ? "Completed games"
                  : "Upcoming games"}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={() => onMonthChange(todayKey.slice(0, 7), todayKey)}
            aria-pressed={monthKey === todayKey.slice(0, 7)}
            className="pressable min-h-11 rounded-lg px-3 text-[13px] font-[650] text-muted hover:bg-surface-strong hover:text-ink"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => changeMonth(-1)}
            aria-label="Previous month"
            className="pressable grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
          >
            <CaretLeft aria-hidden size={17} />
          </button>
          <button
            type="button"
            onClick={() => changeMonth(1)}
            aria-label="Next month"
            className="pressable grid h-11 w-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
          >
            <CaretRight aria-hidden size={17} />
          </button>
        </div>
      </div>

      {error ? (
        <div
          role="alert"
          className="mb-4 flex flex-wrap items-center justify-between gap-3 border-y border-line py-3"
        >
          <p className="text-sm text-muted">
            {error} Your calendar stayed in place.
          </p>
          <button
            type="button"
            onClick={onRetry}
            className="pressable min-h-11 rounded-lg px-3 font-[650] text-primary hover:bg-primary-soft"
          >
            Retry
          </button>
        </div>
      ) : null}

      <div className="lg:grid lg:grid-cols-[minmax(0,1fr)_18rem] lg:gap-6">
        <div className="min-w-0">
          <MobileCalendar
            days={days}
            gamesByDate={gamesByDate}
            selectedDate={selectedDate}
            todayKey={todayKey}
            weekStart={weekStart}
            onSelectDate={onSelectDate}
            onMonthChange={onMonthChange}
          />
          <DesktopCalendar
            days={days}
            gamesByDate={gamesByDate}
            monthKey={monthKey}
            selectedDate={selectedDate}
            todayKey={todayKey}
            weekStart={weekStart}
            onSelectDate={onSelectDate}
            onMonthChange={onMonthChange}
          />
        </div>
        <div className="mt-6 border-t border-line pt-5 lg:mt-0 lg:border-l lg:border-t-0 lg:pl-6 lg:pt-0">
          <DayAgenda
            dateKey={selectedDate}
            games={selectedGames}
            loading={loading}
          />
        </div>
      </div>
    </section>
  );
}
