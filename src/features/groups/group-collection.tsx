"use client";

import { CalendarBlank, CaretRight, GridFour, List, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useSyncExternalStore } from "react";
import { ButtonLink } from "@/components/ui/button";
import { sessionAccentStyle } from "@/features/sessions/accent";

export type GroupCollectionItem = {
  id: string;
  href: string;
  name: string;
  initials: string;
  memberCount: number;
  role: "owner" | "admin" | "member";
  nextGameDate?: string;
  accentColor?: string;
};

type ViewMode = "list" | "grid";
const preferenceKey = "relay-groups-view";

function getView(): ViewMode {
  return localStorage.getItem(preferenceKey) === "grid" ? "grid" : "list";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => { if (event.key === preferenceKey) callback(); };
  window.addEventListener("storage", handleStorage);
  window.addEventListener("relay-groups-view-change", callback);
  return () => {
    window.removeEventListener("storage", handleStorage);
    window.removeEventListener("relay-groups-view-change", callback);
  };
}

function saveView(mode: ViewMode) {
  localStorage.setItem(preferenceKey, mode);
  window.dispatchEvent(new Event("relay-groups-view-change"));
}

function GroupIdentity({ item, large = false }: { item: GroupCollectionItem; large?: boolean }) {
  return <span aria-hidden className={`grid shrink-0 place-items-center rounded-full bg-surface-strong font-bold text-ink ${large ? "h-12 w-12 text-sm" : "h-11 w-11 text-sm"}`}>{item.initials}</span>;
}

function GroupList({ items }: { items: GroupCollectionItem[] }) {
  return <div className="divide-y divide-line border-y border-line">{items.map((item) => <Link href={item.href} prefetch={false} key={item.id} style={item.accentColor ? sessionAccentStyle(item.accentColor) : undefined} className="collection-row pressable group flex min-h-20 items-center gap-4 py-4 hover:bg-surface sm:px-3"><GroupIdentity item={item} /><div className="min-w-0 flex-1"><h3 className="truncate font-[650]">{item.name}</h3><p className="mt-1 truncate text-sm text-muted">{item.memberCount} {item.memberCount === 1 ? "member" : "members"} · {item.nextGameDate ? `Next game ${item.nextGameDate}` : "No upcoming game"}</p></div><span className="hidden text-xs capitalize text-muted sm:block">{item.role}</span><CaretRight aria-hidden className="text-muted transition-transform group-hover:translate-x-0.5" size={16} /></Link>)}</div>;
}

function GroupGrid({ items }: { items: GroupCollectionItem[] }) {
  return <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{items.map((item) => <Link href={item.href} prefetch={false} key={item.id} style={item.accentColor ? sessionAccentStyle(item.accentColor) : undefined} className="pressable group rounded-lg border border-line bg-surface p-5 hover:border-primary/35 hover:bg-surface-strong"><article><div className="flex items-start justify-between gap-4"><GroupIdentity item={item} large /><span className="text-xs capitalize text-muted">{item.role}</span></div><h3 className="mt-5 truncate text-lg font-[680]">{item.name}</h3><div className="mt-3 space-y-2 text-sm text-muted"><p className="flex items-center gap-2"><UsersThree aria-hidden size={16} />{item.memberCount} {item.memberCount === 1 ? "member" : "members"}</p><p className="flex items-center gap-2"><CalendarBlank aria-hidden size={16} />{item.nextGameDate ? `Next game ${item.nextGameDate}` : "No upcoming game"}</p></div><span className="mt-6 inline-flex items-center gap-1 text-sm font-[650] text-primary">Open group <CaretRight aria-hidden size={14} className="transition-transform group-hover:translate-x-0.5" /></span></article></Link>)}</div>;
}

function EmptyGroups() {
  return <section className="border-y border-line lg:grid lg:grid-cols-[1fr_1fr]"><div className="py-8 lg:border-r lg:border-line lg:pr-12"><UsersThree className="text-primary" size={24} weight="regular" /><h3 className="mt-5 max-w-sm text-2xl font-[720] tracking-[-0.025em]">Keep the regular crew together.</h3><p className="mt-3 max-w-md leading-7 text-muted">Start with a standalone game. After everyone plays, save the crew so the next invite takes less work.</p><div className="mt-6 flex flex-wrap gap-2"><ButtonLink href="/groups/new">Create a group</ButtonLink><ButtonLink href="/games/new" variant="secondary">Create a game</ButtonLink></div></div><dl className="divide-y divide-line py-2 lg:py-5 lg:pl-12"><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Members</dt><dd className="text-sm leading-5 text-muted">Signed-in players ready to invite again.</dd></div><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Games</dt><dd className="text-sm leading-5 text-muted">Upcoming plans and past sessions in one place.</dd></div><div className="grid grid-cols-[96px_1fr] gap-4 py-4"><dt className="font-semibold">Memories</dt><dd className="text-sm leading-5 text-muted">Photos and results kept with the people who played.</dd></div></dl></section>;
}

export function GroupCollection({ items }: { items: GroupCollectionItem[] }) {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  return <div className="mt-10"><div className="mb-8 flex items-center justify-between gap-4 border-b border-line pb-4"><p className="text-sm text-muted">{items.length} {items.length === 1 ? "group" : "groups"}</p><div role="group" aria-label="Group view" className="inline-flex rounded-lg bg-surface-strong p-1"><button type="button" aria-label="List view" aria-pressed={mode === "list"} onClick={() => saveView("list")} className={`pressable grid h-9 w-9 place-items-center rounded-lg ${mode === "list" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}><List aria-hidden size={18} /></button><button type="button" aria-label="Grid view" aria-pressed={mode === "grid"} onClick={() => saveView("grid")} className={`pressable grid h-9 w-9 place-items-center rounded-lg ${mode === "grid" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}><GridFour aria-hidden size={17} /></button></div></div><section aria-labelledby="your-groups"><h2 id="your-groups" className="mb-3 text-lg font-[680]">Your groups</h2>{items.length ? mode === "grid" ? <div data-testid="groups-grid"><GroupGrid items={items} /></div> : <div data-testid="groups-list"><GroupList items={items} /></div> : <EmptyGroups />}</section></div>;
}
