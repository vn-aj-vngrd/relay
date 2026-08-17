"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { ClockCounterClockwise, MagnifyingGlass, MapPin, TennisBall, UsersThree } from "@phosphor-icons/react";
import { Avatar } from "@/components/shared/avatar-stack";
import { ButtonSpinner } from "@/components/ui/button";
import { sessionAccentStyle } from "@/features/sessions/accent";
import { mergeRecentSearches, searchFilters, type RecentSearch, type SearchFilter, type SearchResponse, type SearchResult } from "./domain";

const recentKey = "relay-recent-searches-v1";
function syncSearchUrl(url: string) { window.history.replaceState(window.history.state, "", url); }
const labels: Record<SearchFilter, string> = { all: "All", games: "Games", players: "Players", groups: "Groups", venues: "Venues" };

function readRecentSearches(): RecentSearch[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(recentKey) ?? "[]");
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is RecentSearch => typeof item === "object" && item !== null && typeof item.query === "string" && searchFilters.includes(item.filter) && typeof item.savedAt === "number").slice(0, 8);
  } catch { return []; }
}

function ResultIdentity({ result, index }: { result: SearchResult; index: number }) {
  if (result.type === "players") return <Avatar name={result.title} imageUrl={result.imageUrl ?? undefined} index={index} size="sm" />;
  if (result.type === "games") return <span aria-hidden className="h-9 w-1 rounded-full bg-primary" />;
  if (result.type === "groups") return <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-surface-strong text-xs font-bold"><UsersThree size={17} /></span>;
  return <span aria-hidden className="grid h-9 w-9 place-items-center rounded-full bg-surface-strong text-muted"><MapPin size={17} /></span>;
}

function SearchResultRow({ result, index, onOpen }: { result: SearchResult; index: number; onOpen: () => void }) {
  return <Link href={result.href} onClick={onOpen} style={result.accentColor ? sessionAccentStyle(result.accentColor) : undefined} className="collection-row pressable group flex min-h-16 items-center gap-3 py-3 hover:bg-surface-strong sm:px-2"><ResultIdentity result={result} index={index} /><span className="min-w-0 flex-1"><strong className="block truncate text-sm font-semibold">{result.title}</strong><span className="mt-1 block truncate text-sm text-muted">{result.subtitle}</span></span><span className="shrink-0 text-xs text-muted">{labels[result.type]}</span></Link>;
}

function ResultSkeleton() {
  return <div role="status" aria-label="Searching" aria-busy="true" className="divide-y divide-line border-y border-line">{Array.from({ length: 6 }, (_, index) => <div key={index} className="flex min-h-16 items-center gap-3 py-3"><span className="h-9 w-9 animate-pulse rounded-full bg-surface-strong" /><span className="flex-1"><span className="block h-4 w-40 max-w-[55%] animate-pulse rounded bg-surface-strong" /><span className="mt-2 block h-3 w-64 max-w-[75%] animate-pulse rounded bg-surface-strong" /></span></div>)}</div>;
}

export function GlobalSearch({ initialQuery = "", initialFilter = "all" }: { initialQuery?: string; initialFilter?: SearchFilter }) {
  const [query, setQuery] = useState(initialQuery);
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery.trim());
  const [filter, setFilter] = useState<SearchFilter>(initialFilter);
  const [items, setItems] = useState<SearchResult[]>([]);
  const [nextCursor, setNextCursor] = useState<number | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "error">(initialQuery ? "loading" : "idle");
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  const [recent, setRecent] = useState<RecentSearch[]>([]);
  const requestRef = useRef<AbortController | null>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setRecent(readRecentSearches()));
    return () => window.cancelAnimationFrame(frame);
  }, []);
  useEffect(() => {
    const normalized = query.trim();
    if (!normalized) return;
    const timer = window.setTimeout(() => setDebouncedQuery(normalized), 180);
    return () => window.clearTimeout(timer);
  }, [query]);

  const fetchPage = useCallback(async (cursor: number, append: boolean) => {
    if (!debouncedQuery) return;
    requestRef.current?.abort();
    const controller = new AbortController(); requestRef.current = controller;
    if (append) { setLoadingMore(true); setLoadMoreError(false); }
    try {
      const params = new URLSearchParams({ q: debouncedQuery, type: filter, cursor: String(cursor) });
      const response = await fetch(`/api/search?${params}`, { signal: controller.signal, headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error("SEARCH_FAILED");
      const data = await response.json() as SearchResponse;
      setItems((current) => append ? [...current, ...data.items] : data.items);
      setNextCursor(data.nextCursor);
      setStatus("ready");
      syncSearchUrl(`/search?q=${encodeURIComponent(debouncedQuery)}${filter === "all" ? "" : `&type=${filter}`}`);
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        if (append) setLoadMoreError(true);
        else setStatus("error");
      }
    } finally { setLoadingMore(false); }
  }, [debouncedQuery, filter]);

  useEffect(() => {
    let cancelled = false;
    if (debouncedQuery) queueMicrotask(() => { if (!cancelled) void fetchPage(0, false); });
    return () => { cancelled = true; requestRef.current?.abort(); };
  }, [debouncedQuery, fetchPage]);
  const loadMore = useCallback(() => { if (nextCursor !== null && !loadingMore) void fetchPage(nextCursor, true); }, [fetchPage, loadingMore, nextCursor]);
  useEffect(() => {
    const node = sentinelRef.current;
    if (!node || nextCursor === null) return;
    const observer = new IntersectionObserver((entries) => { if (entries[0]?.isIntersecting) loadMore(); }, { rootMargin: "240px" });
    observer.observe(node);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  function updateQuery(next: string) {
    requestRef.current?.abort();
    setQuery(next);
    setItems([]);
    setNextCursor(null);
    setLoadMoreError(false);
    if (next.trim()) setStatus("loading");
    else {
      setDebouncedQuery("");
      setStatus("idle");
      syncSearchUrl(filter === "all" ? "/search" : `/search?type=${filter}`);
    }
  }
  function chooseFilter(next: SearchFilter) {
    setFilter(next); setItems([]); setNextCursor(null); setLoadMoreError(false);
    if (query.trim()) setStatus("loading");
    else syncSearchUrl(next === "all" ? "/search" : `/search?type=${next}`);
  }
  function saveRecent() {
    const next = mergeRecentSearches(recent, { query: debouncedQuery || query, filter });
    setRecent(next); localStorage.setItem(recentKey, JSON.stringify(next));
  }
  function removeRecent(saved: RecentSearch) {
    const next = recent.filter((item) => item.query !== saved.query || item.filter !== saved.filter);
    setRecent(next); localStorage.setItem(recentKey, JSON.stringify(next));
  }
  function applyRecent(saved: RecentSearch) { setFilter(saved.filter); updateQuery(saved.query); }

  const grouped = searchFilters.slice(1).map((type) => ({ type, items: items.filter((item) => item.type === type) })).filter((section) => section.items.length);
  return <div className="mx-auto max-w-3xl"><header><h1 className="app-title">Search Relay</h1><p className="mt-2 text-muted">Find games, players, groups, and places to play.</p></header>
    <div className="sticky top-[56px] z-10 -mx-4 mt-6 bg-surface px-4 pb-1 pt-1 sm:-mx-8 sm:px-8 lg:static lg:mx-0 lg:p-0"><div className="relative"><MagnifyingGlass aria-hidden className="pointer-events-none absolute left-3.5 top-3.5 text-muted" size={18} /><label htmlFor="global-search" className="sr-only">Search Relay</label><input autoFocus id="global-search" value={query} onChange={(event) => updateQuery(event.target.value)} onKeyDown={(event) => { if (event.key === "Escape") updateQuery(""); }} autoComplete="off" spellCheck={false} placeholder="Search games, players, groups, venues…" className="h-12 w-full rounded-[10px] border border-line bg-surface pl-11 pr-12 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none" />{query ? <button type="button" onClick={() => updateQuery("")} aria-label="Clear search" className="pressable absolute right-1 top-1 grid h-10 w-10 place-items-center text-xl text-muted hover:text-ink">×</button> : null}</div>
      <nav aria-label="Search filters" className="public-session-scroll mt-3 overflow-x-auto border-b border-line"><ul className="flex min-w-max">{searchFilters.map((type) => <li key={type}><button type="button" onClick={() => chooseFilter(type)} aria-pressed={filter === type} className={`relative min-h-10 px-3 text-[13px] font-medium ${filter === type ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}>{labels[type]}</button></li>)}</ul></nav></div>

    <div className="pt-6"><span className="sr-only" aria-live="polite">{status === "loading" ? "Searching" : status === "ready" ? `${items.length} results loaded` : status === "error" ? "Search unavailable" : ""}</span>
      {!query.trim() ? recent.length ? <section aria-labelledby="recent-searches"><div className="flex items-center justify-between"><h2 id="recent-searches" className="text-lg font-bold">Recent searches</h2><button type="button" onClick={() => { setRecent([]); localStorage.removeItem(recentKey); }} className="min-h-9 text-[13px] font-semibold text-muted hover:text-ink">Clear all</button></div><ul className="mt-3 divide-y divide-line border-y border-line">{recent.map((saved) => <li key={`${saved.filter}-${saved.query}`} className="flex min-h-14 items-center gap-2"><button type="button" onClick={() => applyRecent(saved)} className="flex min-h-14 min-w-0 flex-1 items-center gap-3 text-left"><ClockCounterClockwise aria-hidden size={17} className="shrink-0 text-muted" /><span className="min-w-0 flex-1 truncate text-sm font-medium">{saved.query}</span><span className="text-xs text-muted">{labels[saved.filter]}</span></button><button type="button" onClick={() => removeRecent(saved)} aria-label={`Remove ${saved.query} from recent searches`} className="grid h-10 w-10 place-items-center text-lg text-muted hover:text-ink">×</button></li>)}</ul></section> : <section className="border-y border-line py-10"><TennisBall aria-hidden size={23} className="text-primary" /><h2 className="mt-4 text-xl font-bold">Find your next game</h2><p className="mt-2 max-w-md text-sm leading-6 text-muted">Search a friend’s name, a regular group, a venue, or a game title. Results appear as you type.</p></section>
      : status === "loading" && !items.length ? <ResultSkeleton />
      : status === "error" ? <section className="border-y border-line py-9"><h2 className="font-bold">Search is unavailable</h2><p className="mt-2 text-sm text-muted">Check your connection and try again.</p><button type="button" onClick={() => void fetchPage(0, false)} className="mt-4 min-h-9 rounded-lg bg-primary px-3 text-[13px] font-semibold text-white">Try again</button></section>
      : status === "ready" && !items.length ? <section className="border-y border-line py-10"><MagnifyingGlass aria-hidden size={22} className="text-primary" /><h2 className="mt-4 text-xl font-bold">No results for “{debouncedQuery}”</h2><p className="mt-2 text-sm text-muted">Try a player username, venue name, or a shorter phrase.</p></section>
      : filter === "all" ? <div className="space-y-8">{grouped.map((section) => <section key={section.type} aria-labelledby={`results-${section.type}`}><div className="mb-2 flex items-center justify-between"><h2 id={`results-${section.type}`} className="text-sm font-bold">{labels[section.type]}</h2><button type="button" onClick={() => chooseFilter(section.type)} className="min-h-9 text-[13px] font-semibold text-primary">See all</button></div><div className="divide-y divide-line border-y border-line">{section.items.map((result, index) => <SearchResultRow key={`${result.type}-${result.id}`} result={result} index={index} onOpen={saveRecent} />)}</div></section>)}</div>
      : <div className="divide-y divide-line border-y border-line">{items.map((result, index) => <SearchResultRow key={`${result.type}-${result.id}`} result={result} index={index} onOpen={saveRecent} />)}</div>}
      {query.trim() && nextCursor !== null && status === "ready" ? <div ref={sentinelRef} className="flex min-h-20 items-center justify-center"><button type="button" onClick={loadMore} disabled={loadingMore} className="inline-flex min-h-9 items-center gap-2 text-[13px] font-semibold text-muted hover:text-ink disabled:opacity-60">{loadingMore ? <><ButtonSpinner />Loading more…</> : loadMoreError ? "Try loading more again" : "Load more results"}</button></div> : null}
    </div>
  </div>;
}
