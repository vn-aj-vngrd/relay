"use client";

import { CalendarBlank, CaretLeft, CaretRight, GridFour, List, MapPin, Users } from "@phosphor-icons/react";
import Link from "next/link";
import { useState, useSyncExternalStore } from "react";

export type GameCollectionItem = {
  id: string;
  href: string;
  title: string;
  date: string;
  dateKey: string;
  time: string;
  venue: string;
  playerCount: number;
  capacity: number;
  status: "draft" | "published" | "live" | "completed" | "cancelled";
};

type ViewMode = "list" | "grid" | "calendar";
const preferenceKey = "relay-games-view";

function getView(): ViewMode {
  const saved = localStorage.getItem(preferenceKey);
  return saved === "grid" || saved === "calendar" ? saved : "list";
}

function getWeekStart(): "sunday" | "monday" {
  return localStorage.getItem("relay-week-start") === "monday" ? "monday" : "sunday";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => { if (event.key === preferenceKey || event.key === "relay-week-start") callback(); };
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

function EmptyCollection({ past }: { past?: boolean }) {
  return <div className="border-y border-line py-8"><p className="font-[650]">{past ? "No game memories yet" : "Nothing scheduled"}</p><p className="mt-1 text-sm text-muted">{past ? "Completed games will stay here with scores and photos." : "Create a game, share the link, and let the roster fill itself."}</p>{!past ? <Link href="/games/new" className="mt-5 inline-flex min-h-11 items-center rounded-lg bg-primary px-4 text-sm font-[650] text-white hover:bg-primary-hover">Create game</Link> : null}</div>;
}

function GameList({ items }: { items: GameCollectionItem[] }) {
  return <div className="divide-y divide-line border-y border-line">{items.map((game) => <Link href={game.href} prefetch={false} key={game.id} className="collection-row pressable group flex min-h-20 items-center gap-4 py-4 hover:bg-surface sm:px-3"><time className="score w-20 shrink-0 text-sm font-bold text-primary">{game.date}</time><div className="min-w-0 flex-1"><h3 className="truncate font-[650]">{game.title}</h3><p className="mt-1 truncate text-sm text-muted">{game.time} · {game.venue}</p></div><span className="score hidden text-sm text-muted sm:block">{game.playerCount} / {game.capacity}</span><CaretRight aria-hidden size={16} className="text-muted transition-transform group-hover:translate-x-0.5" /></Link>)}</div>;
}

function GameGrid({ items }: { items: GameCollectionItem[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((game) => <Link href={game.href} prefetch={false} key={game.id} className="pressable group rounded-lg border border-line bg-surface p-5 hover:border-primary/35 hover:bg-surface-strong"><article><div className="flex items-center justify-between gap-4"><time className="score text-xs font-bold text-primary">{game.date}</time><span className="score text-xs text-muted">{game.playerCount} / {game.capacity}</span></div><h3 className="mt-5 truncate text-lg font-[680]">{game.title}</h3><div className="mt-3 space-y-2 text-sm text-muted"><p className="flex items-center gap-2"><CalendarBlank aria-hidden size={16} />{game.time}</p><p className="flex items-center gap-2"><MapPin aria-hidden size={16} /><span className="truncate">{game.venue}</span></p><p className="flex items-center gap-2 sm:hidden"><Users aria-hidden size={16} />{game.playerCount} players</p></div><span className="mt-6 inline-flex items-center gap-1 text-sm font-[650] text-primary">Open game <CaretRight aria-hidden size={14} className="transition-transform group-hover:translate-x-0.5" /></span></article></Link>)}</div>;
}

function MonthCalendar({ upcoming, past, todayKey, weekStart }: { upcoming: GameCollectionItem[]; past: GameCollectionItem[]; todayKey: string; weekStart: "sunday" | "monday" }) {
  const [monthKey, setMonthKey] = useState(todayKey.slice(0, 7));
  const month = new Date(`${monthKey}-01T00:00:00Z`);
  const year = month.getUTCFullYear();
  const monthIndex = month.getUTCMonth();
  const leadingDays = weekStart === "monday" ? (month.getUTCDay() + 6) % 7 : month.getUTCDay();
  const dayCount = new Date(Date.UTC(year, monthIndex + 1, 0)).getUTCDate();
  const games = [...upcoming.map((game) => ({ ...game, phase: game.status === "live" ? "live" as const : "upcoming" as const })), ...past.map((game) => ({ ...game, phase: "past" as const }))];
  const gamesByDate = new Map<string, typeof games>();
  games.forEach((game) => gamesByDate.set(game.dateKey, [...(gamesByDate.get(game.dateKey) ?? []), game]));
  const changeMonth = (amount: number) => {
    const next = new Date(Date.UTC(year, monthIndex + amount, 1));
    setMonthKey(`${next.getUTCFullYear()}-${String(next.getUTCMonth() + 1).padStart(2, "0")}`);
  };
  const title = new Intl.DateTimeFormat("en-US", { month: "long", year: "numeric", timeZone: "UTC" }).format(month);
  const cells = [...Array.from({ length: leadingDays }, () => null), ...Array.from({ length: dayCount }, (_, index) => index + 1)];

  return <section aria-labelledby="calendar-month"><div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><div><h2 id="calendar-month" className="text-xl font-[680]">{title}</h2><p className="mt-1 text-sm text-muted"><span className="text-live">● Live</span><span className="mx-2">·</span><span className="text-primary">● Upcoming</span><span className="mx-2">·</span>Past</p></div><div className="flex self-end gap-1 sm:self-auto"><button type="button" onClick={() => changeMonth(-1)} aria-label="Previous month" className="pressable grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"><CaretLeft aria-hidden size={16} /></button><button type="button" onClick={() => setMonthKey(todayKey.slice(0, 7))} className="pressable min-h-11 rounded-md px-3 text-sm font-[650] text-muted hover:bg-surface-strong hover:text-ink">Today</button><button type="button" onClick={() => changeMonth(1)} aria-label="Next month" className="pressable grid h-11 w-11 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"><CaretRight aria-hidden size={16} /></button></div></div><div className="grid grid-cols-7 text-center text-xs font-[650] text-muted">{(weekStart === "monday" ? ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]).map((day) => <div key={day} className="py-2">{day}</div>)}</div><div className="grid grid-cols-7 border-l border-t border-line">{cells.map((day, index) => {
    if (!day) return <div key={`empty-${index}`} aria-hidden className="min-h-14 border-b border-r border-line bg-surface/35 sm:min-h-28" />;
    const dateKey = `${year}-${String(monthIndex + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
    const dayGames = gamesByDate.get(dateKey) ?? [];
    const fullDate = new Intl.DateTimeFormat("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" }).format(new Date(`${dateKey}T00:00:00Z`));
    return <div key={dateKey} aria-label={`${fullDate}, ${dayGames.length} ${dayGames.length === 1 ? "game" : "games"}`} className={`min-h-14 min-w-0 border-b border-r border-line p-1.5 sm:min-h-28 sm:p-2 ${dateKey === todayKey ? "bg-primary-soft/55" : "bg-surface"}`}><time dateTime={dateKey} className={`score text-xs font-semibold ${dateKey === todayKey ? "text-primary" : "text-muted"}`}>{day}</time><div className="mt-1 space-y-1">{dayGames.slice(0, 2).map((game) => <Link key={game.id} href={game.href} prefetch={false} className={`block min-h-5 rounded-md px-1.5 py-1 text-left text-[11px] font-[650] leading-4 ${game.phase === "live" ? "bg-live/12 text-live" : game.phase === "upcoming" ? "bg-primary-soft text-primary" : "bg-surface-strong text-muted"}`}><span className="sr-only sm:not-sr-only sm:line-clamp-1">{game.title}</span><span aria-hidden className={`mx-auto block h-1.5 w-1.5 rounded-full sm:hidden ${game.phase === "live" ? "bg-live" : game.phase === "upcoming" ? "bg-primary" : "bg-muted"}`} /></Link>)}{dayGames.length > 2 ? <p className="text-center text-[10px] text-muted">+{dayGames.length - 2}</p> : null}</div></div>;
  })}</div></section>;
}

function CollectionSection({ title, items, mode, past }: { title: string; items: GameCollectionItem[]; mode: Exclude<ViewMode, "calendar">; past?: boolean }) {
  return <section><h2 className="mb-3 text-lg font-[680]">{title}</h2>{items.length ? mode === "grid" ? <GameGrid items={items} /> : <GameList items={items} /> : <EmptyCollection past={past} />}</section>;
}

export function GameCollection({ upcoming, past, todayKey }: { upcoming: GameCollectionItem[]; past: GameCollectionItem[]; todayKey: string }) {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  const weekStart = useSyncExternalStore(subscribe, getWeekStart, (): "sunday" | "monday" => "sunday");
  return <div className="mt-10">
    <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4"><p className="text-sm text-muted">{upcoming.length + past.length} {upcoming.length + past.length === 1 ? "game" : "games"}</p><div aria-label="Game view" className="inline-flex rounded-lg bg-surface-strong p-1"><button type="button" aria-label="List view" aria-pressed={mode === "list"} onClick={() => saveView("list")} className={`pressable grid h-10 w-10 place-items-center rounded-lg ${mode === "list" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}><List aria-hidden size={18} /></button><button type="button" aria-label="Grid view" aria-pressed={mode === "grid"} onClick={() => saveView("grid")} className={`pressable grid h-10 w-10 place-items-center rounded-lg ${mode === "grid" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}><GridFour aria-hidden size={17} /></button><button type="button" aria-label="Calendar view" aria-pressed={mode === "calendar"} onClick={() => saveView("calendar")} className={`pressable grid h-10 w-10 place-items-center rounded-lg ${mode === "calendar" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}><CalendarBlank aria-hidden size={18} /></button></div></div>
    {mode === "calendar" ? <div data-testid="games-calendar"><MonthCalendar upcoming={upcoming} past={past} todayKey={todayKey} weekStart={weekStart} /></div> : <div data-testid={mode === "grid" ? "games-grid" : "games-list"} className="space-y-12"><CollectionSection title="Upcoming" items={upcoming} mode={mode} /><CollectionSection title="Past games" items={past} mode={mode} past /></div>}
  </div>;
}
