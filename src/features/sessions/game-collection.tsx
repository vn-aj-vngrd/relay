"use client";

import { CalendarDays, ChevronRight, Grid2X2, List, MapPin, Users } from "lucide-react";
import Link from "next/link";
import { useSyncExternalStore } from "react";

export type GameCollectionItem = {
  id: string;
  href: string;
  title: string;
  date: string;
  time: string;
  venue: string;
  playerCount: number;
  capacity: number;
};

type ViewMode = "list" | "grid";
const preferenceKey = "relay-games-view";

function getView(): ViewMode {
  return localStorage.getItem(preferenceKey) === "grid" ? "grid" : "list";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => { if (event.key === preferenceKey) callback(); };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("relay-games-view-change", callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("relay-games-view-change", callback);
  };
}

function saveView(mode: ViewMode) {
  localStorage.setItem(preferenceKey, mode);
  window.dispatchEvent(new Event("relay-games-view-change"));
}

function EmptyCollection({ past }: { past?: boolean }) {
  return <div className="border-y border-line py-8"><p className="font-[650]">{past ? "No game memories yet" : "Nothing scheduled"}</p><p className="mt-1 text-sm text-muted">{past ? "Completed games will stay here with scores and photos." : "Create a game, share the link, and let the roster fill itself."}</p>{!past ? <Link href="/games/new" className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-primary px-4 text-sm font-[650] text-white hover:bg-primary-hover">Create game</Link> : null}</div>;
}

function GameList({ items }: { items: GameCollectionItem[] }) {
  return <div className="divide-y divide-line border-y border-line">{items.map((game) => <Link href={game.href} key={game.id} className="pressable group flex min-h-20 items-center gap-4 py-4 hover:bg-surface sm:px-3"><time className="score w-20 shrink-0 text-sm font-bold text-primary">{game.date}</time><div className="min-w-0 flex-1"><h3 className="truncate font-[650]">{game.title}</h3><p className="mt-1 truncate text-sm text-muted">{game.time} · {game.venue}</p></div><span className="score hidden text-sm text-muted sm:block">{game.playerCount} / {game.capacity}</span><ChevronRight aria-hidden size={19} className="text-muted transition-transform group-hover:translate-x-0.5" /></Link>)}</div>;
}

function GameGrid({ items }: { items: GameCollectionItem[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((game) => <Link href={game.href} key={game.id} className="pressable group rounded-2xl border border-line bg-surface p-5 hover:border-primary/35 hover:bg-surface-strong"><article><div className="flex items-center justify-between gap-4"><time className="score text-xs font-bold text-primary">{game.date}</time><span className="score text-xs text-muted">{game.playerCount} / {game.capacity}</span></div><h3 className="mt-5 truncate text-lg font-[680]">{game.title}</h3><div className="mt-3 space-y-2 text-sm text-muted"><p className="flex items-center gap-2"><CalendarDays aria-hidden size={16} />{game.time}</p><p className="flex items-center gap-2"><MapPin aria-hidden size={16} /><span className="truncate">{game.venue}</span></p><p className="flex items-center gap-2 sm:hidden"><Users aria-hidden size={16} />{game.playerCount} players</p></div><span className="mt-6 inline-flex items-center gap-1 text-sm font-[650] text-primary">Open game <ChevronRight aria-hidden size={16} className="transition-transform group-hover:translate-x-0.5" /></span></article></Link>)}</div>;
}

function CollectionSection({ title, items, mode, past }: { title: string; items: GameCollectionItem[]; mode: ViewMode; past?: boolean }) {
  return <section><h2 className="mb-3 text-lg font-[680]">{title}</h2>{items.length ? mode === "grid" ? <GameGrid items={items} /> : <GameList items={items} /> : <EmptyCollection past={past} />}</section>;
}

export function GameCollection({ upcoming, past }: { upcoming: GameCollectionItem[]; past: GameCollectionItem[] }) {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  return <div className="mt-10">
    <div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4"><p className="text-sm text-muted">{upcoming.length + past.length} {upcoming.length + past.length === 1 ? "game" : "games"}</p><div aria-label="Game view" className="inline-flex rounded-xl bg-surface-strong p-1"><button type="button" aria-label="List view" aria-pressed={mode === "list"} onClick={() => saveView("list")} className={`pressable grid h-10 w-10 place-items-center rounded-lg ${mode === "list" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}><List aria-hidden size={18} /></button><button type="button" aria-label="Grid view" aria-pressed={mode === "grid"} onClick={() => saveView("grid")} className={`pressable grid h-10 w-10 place-items-center rounded-lg ${mode === "grid" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}><Grid2X2 aria-hidden size={17} /></button></div></div>
    <div data-testid={mode === "grid" ? "games-grid" : "games-list"} className="space-y-12"><CollectionSection title="Upcoming" items={upcoming} mode={mode} /><CollectionSection title="Past games" items={past} mode={mode} past /></div>
  </div>;
}
