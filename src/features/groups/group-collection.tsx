"use client";

import { CalendarBlank, CaretRight, GridFour, List, UsersThree } from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

import { ButtonLink } from "@/components/ui/button";
import { MobileViewMenu } from "@/components/ui/mobile-view-menu";
import { sessionAccentStyle } from "@/features/sessions/accent";

export type GroupCollectionItem = {
  id: string;
  href: string;
  name: string;
  initials: string;
  imageUrl?: string;
  memberCount: number;
  role: "owner" | "admin" | "member";
  nextGameDate?: string;
  accentColor?: string;
};

type ViewMode = "list" | "grid";
const preferenceKey = "relay-groups-view";
const viewOptions = [
  { value: "list" as const, label: "List", icon: List },
  { value: "grid" as const, label: "Grid", icon: GridFour },
];

function getView(): ViewMode {
  return localStorage.getItem(preferenceKey) === "grid" ? "grid" : "list";
}

function subscribe(callback: () => void) {
  const handleStorage = (event: StorageEvent) => {
    if (event.key === preferenceKey) callback();
  };
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
  const size = large ? "h-10 w-10 sm:h-12 sm:w-12" : "h-10 w-10 sm:h-11 sm:w-11";
  return item.imageUrl ? (
    <span aria-hidden className={`relative shrink-0 overflow-hidden rounded-full border border-line ${size}`}>
      <Image src={item.imageUrl} alt="" fill className="object-cover" />
    </span>
  ) : (
    <span
      aria-hidden
      className={`grid shrink-0 place-items-center rounded-full bg-surface-strong text-xs font-bold text-ink sm:text-sm ${size}`}
    >
      {item.initials}
    </span>
  );
}

function GroupList({ items }: { items: GroupCollectionItem[] }) {
  return (
    <div className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <Link
          href={item.href}
          prefetch={false}
          key={item.id}
          style={item.accentColor ? sessionAccentStyle(item.accentColor) : undefined}
          className="collection-row group-list-item pressable group flex min-h-[4.5rem] items-center gap-3 py-3.5 [content-visibility:auto] [contain-intrinsic-size:auto_80px] hover:bg-surface sm:min-h-20 sm:gap-4 sm:px-3 sm:py-4"
        >
          <GroupIdentity item={item} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-[650]">{item.name}</h3>
            <p className="mt-1 truncate text-sm text-muted">
              {item.memberCount} {item.memberCount === 1 ? "member" : "members"} ·{" "}
              {item.nextGameDate ? `Next game ${item.nextGameDate}` : "No upcoming game"}
            </p>
          </div>
          <span className="hidden text-xs capitalize text-muted sm:block">{item.role}</span>
          <CaretRight aria-hidden className="text-muted transition-transform group-hover:translate-x-0.5" size={16} />
        </Link>
      ))}
    </div>
  );
}

function GroupGrid({ items }: { items: GroupCollectionItem[] }) {
  return (
    <div className="grid gap-3 min-[380px]:grid-cols-2 sm:gap-4 xl:grid-cols-3">
      {items.map((item) => (
        <Link
          href={item.href}
          prefetch={false}
          key={item.id}
          style={item.accentColor ? sessionAccentStyle(item.accentColor) : undefined}
          className="group-grid-item pressable group overflow-hidden rounded-lg border border-line bg-surface p-3.5 [content-visibility:auto] [contain-intrinsic-size:auto_220px] hover:border-primary/35 hover:bg-surface-strong sm:p-5"
        >
          <article className="flex h-full min-w-0 flex-col">
            <div className="flex items-start justify-between gap-4">
              <GroupIdentity item={item} large />
              <span className="text-xs capitalize text-muted">{item.role}</span>
            </div>
            <h3 className="mt-3 line-clamp-2 text-[15px] font-[680] leading-5 sm:mt-5 sm:truncate sm:text-lg sm:leading-normal">
              {item.name}
            </h3>
            <div className="mt-2 space-y-1.5 text-[13px] text-muted sm:mt-3 sm:space-y-2 sm:text-sm">
              <p className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <UsersThree aria-hidden size={15} className="shrink-0" />
                {item.memberCount} {item.memberCount === 1 ? "member" : "members"}
              </p>
              <p className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <CalendarBlank aria-hidden size={15} className="shrink-0" />
                <span className="truncate">{item.nextGameDate ? `Next ${item.nextGameDate}` : "No upcoming game"}</span>
              </p>
            </div>
            <span className="mt-6 hidden items-center gap-1 text-sm font-[650] text-primary sm:inline-flex">
              Open group{" "}
              <CaretRight aria-hidden size={14} className="transition-transform group-hover:translate-x-0.5" />
            </span>
          </article>
        </Link>
      ))}
    </div>
  );
}

function EmptyGroups() {
  return (
    <section className="border-y border-line lg:grid lg:grid-cols-[1fr_1fr]">
      <div className="py-8 lg:border-r lg:border-line lg:pr-12">
        <UsersThree className="text-primary" size={24} weight="regular" />
        <h3 className="mt-5 max-w-sm text-2xl font-[720] tracking-[-0.025em]">Keep the regular crew together.</h3>
        <p className="mt-3 max-w-md leading-7 text-muted">
          Start with a standalone game. After everyone plays, save the crew so the next invite takes less work.
        </p>
        <div className="mt-6 flex flex-wrap gap-2">
          <ButtonLink href="/groups/new">Create a group</ButtonLink>
          <ButtonLink href="/games/new" variant="secondary">
            Create a game
          </ButtonLink>
        </div>
      </div>
      <dl className="divide-y divide-line py-2 lg:py-5 lg:pl-12">
        <div className="grid grid-cols-[96px_1fr] gap-4 py-4">
          <dt className="font-semibold">Members</dt>
          <dd className="text-sm leading-5 text-muted">Signed-in players ready to invite again.</dd>
        </div>
        <div className="grid grid-cols-[96px_1fr] gap-4 py-4">
          <dt className="font-semibold">Games</dt>
          <dd className="text-sm leading-5 text-muted">See upcoming and past games for this group.</dd>
        </div>
        <div className="grid grid-cols-[96px_1fr] gap-4 py-4">
          <dt className="font-semibold">Memories</dt>
          <dd className="text-sm leading-5 text-muted">Photos and results kept with the people who played.</dd>
        </div>
      </dl>
    </section>
  );
}

export function GroupViewMenu() {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  return <MobileViewMenu label="Group view" value={mode} options={viewOptions} onChange={saveView} />;
}

export function GroupCollection({
  items: initialItems,
  nextCursor: initialNextCursor = null,
}: {
  items: GroupCollectionItem[];
  nextCursor?: string | null;
}) {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/groups?cursor=${encodeURIComponent(nextCursor)}`, { cache: "no-store" });
      if (!response.ok) throw new Error("request failed");
      const page = (await response.json()) as { items: GroupCollectionItem[]; nextCursor: string | null };
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      setError("More groups couldn’t be loaded. Try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [nextCursor]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !nextCursor || typeof IntersectionObserver === "undefined") return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMore();
      },
      { rootMargin: "320px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  return (
    <div className="mt-5 sm:mt-10">
      <div className="mb-8 hidden items-center justify-between gap-4 border-b border-line pb-4 sm:flex">
        <p className="text-sm text-muted">
          {items.length} {items.length === 1 ? "group" : "groups"}
        </p>
        <div role="group" aria-label="Group view" className="inline-flex rounded-lg bg-surface-strong p-1">
          <button
            type="button"
            aria-label="List view"
            aria-pressed={mode === "list"}
            onClick={() => saveView("list")}
            className={`pressable grid h-9 w-9 place-items-center rounded-lg ${mode === "list" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}
          >
            <List aria-hidden size={18} />
          </button>
          <button
            type="button"
            aria-label="Grid view"
            aria-pressed={mode === "grid"}
            onClick={() => saveView("grid")}
            className={`pressable grid h-9 w-9 place-items-center rounded-lg ${mode === "grid" ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}
          >
            <GridFour aria-hidden size={17} />
          </button>
        </div>
      </div>
      <section aria-labelledby="your-groups">
        <h2 id="your-groups" className="mb-3 text-lg font-[680]">
          Your groups
        </h2>
        {items.length ? (
          mode === "grid" ? (
            <div data-testid="groups-grid">
              <GroupGrid items={items} />
            </div>
          ) : (
            <div data-testid="groups-list">
              <GroupList items={items} />
            </div>
          )
        ) : (
          <EmptyGroups />
        )}
      </section>
      {items.length ? (
        <div ref={sentinelRef} className="flex min-h-20 items-center justify-center" aria-live="polite">
          {nextCursor ? (
            <button
              type="button"
              onClick={() => void loadMore()}
              disabled={loading}
              className="pressable min-h-11 rounded-lg px-4 text-sm font-semibold text-primary hover:bg-primary-soft disabled:text-muted"
            >
              {loading ? "Loading more groups…" : "Load more groups"}
            </button>
          ) : (
            <p className="text-sm text-muted">All {items.length} groups loaded.</p>
          )}
        </div>
      ) : null}
      {error ? (
        <p role="alert" className="pb-4 text-center text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}
