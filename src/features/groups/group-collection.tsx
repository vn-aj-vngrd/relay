"use client";

import {
  CalendarBlank,
  CaretRight,
  GridFour,
  List,
  UsersThree,
} from "@phosphor-icons/react";
import Image from "next/image";
import Link from "next/link";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import { Skeleton } from "@/components/shared/skeleton";
import { ButtonLink } from "@/components/ui/button";
import { MobileViewMenu } from "@/components/ui/mobile-view-menu";
import { sessionAccentStyle } from "@/features/sessions/accent";
import {
  GameResultsTransition,
  useGameResultsTransition,
} from "@/features/sessions/game-results-transition";
import {
  defaultGroupFilters,
  type GroupFilters as GroupFilterValues,
  groupFilterParams,
} from "./filters";
import { GroupFilters } from "./group-filters";

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

function GroupIdentity({
  item,
  large = false,
}: {
  item: GroupCollectionItem;
  large?: boolean;
}) {
  const size = large
    ? "h-10 w-10 sm:h-12 sm:w-12"
    : "h-10 w-10 sm:h-11 sm:w-11";
  return item.imageUrl ? (
    <span
      aria-hidden
      className={`relative shrink-0 overflow-hidden rounded-full border border-line ${size}`}
    >
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
          style={
            item.accentColor ? sessionAccentStyle(item.accentColor) : undefined
          }
          className="collection-row group-list-item pressable group flex min-h-[4.5rem] items-center gap-3 py-3.5 [content-visibility:auto] [contain-intrinsic-size:auto_80px] hover:bg-surface sm:min-h-20 sm:gap-4 sm:px-3 sm:py-4"
        >
          <GroupIdentity item={item} />
          <div className="min-w-0 flex-1">
            <h3 className="truncate font-[650]">{item.name}</h3>
            <p className="mt-1 truncate text-sm text-muted">
              {item.memberCount} {item.memberCount === 1 ? "member" : "members"}{" "}
              ·{" "}
              {item.nextGameDate
                ? `Next game ${item.nextGameDate}`
                : "No upcoming game"}
            </p>
          </div>
          <span className="hidden text-xs capitalize text-muted sm:block">
            {item.role}
          </span>
          <CaretRight
            aria-hidden
            className="text-muted transition-transform group-hover:translate-x-0.5"
            size={16}
          />
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
          style={
            item.accentColor ? sessionAccentStyle(item.accentColor) : undefined
          }
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
                {item.memberCount}{" "}
                {item.memberCount === 1 ? "member" : "members"}
              </p>
              <p className="flex min-w-0 items-center gap-1.5 sm:gap-2">
                <CalendarBlank aria-hidden size={15} className="shrink-0" />
                <span className="truncate">
                  {item.nextGameDate
                    ? `Next ${item.nextGameDate}`
                    : "No upcoming game"}
                </span>
              </p>
            </div>
            <span className="mt-6 hidden items-center gap-1 text-sm font-[650] text-primary sm:inline-flex">
              Open group{" "}
              <CaretRight
                aria-hidden
                size={14}
                className="transition-transform group-hover:translate-x-0.5"
              />
            </span>
          </article>
        </Link>
      ))}
    </div>
  );
}

function EmptyGroups({ filtered }: { filtered: boolean }) {
  return (
    <section className="py-9">
      <h2 className="text-lg font-bold">
        {filtered ? "No groups match these filters" : "No groups yet"}
      </h2>
      <p className="mt-2 max-w-lg text-sm leading-6 text-muted">
        {filtered
          ? "Try another name or role."
          : "Create a group for your regular crew."}
      </p>
      <ButtonLink href={filtered ? "/groups" : "/groups/new"} className="mt-4">
        {filtered ? "Clear filters" : "Create group"}
      </ButtonLink>
    </section>
  );
}

export function GroupResultsSkeleton() {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  return (
    <div
      role="status"
      aria-label="Loading groups"
      aria-busy="true"
      data-testid="groups-skeleton"
      className={
        mode === "grid"
          ? "grid gap-3 min-[380px]:grid-cols-2 sm:gap-4 xl:grid-cols-3"
          : "divide-y divide-line border-y border-line"
      }
    >
      {Array.from({ length: mode === "grid" ? 6 : 4 }, (_, index) => (
        <div
          key={index}
          className={
            mode === "grid"
              ? "rounded-lg border border-line bg-surface p-3.5 sm:p-5"
              : "flex min-h-[4.5rem] items-center gap-3 py-3.5 sm:min-h-20 sm:gap-4 sm:px-3 sm:py-4"
          }
        >
          <Skeleton className="size-11 shrink-0 rounded-full" />
          <div className={mode === "grid" ? "mt-5" : "min-w-0 flex-1"}>
            <Skeleton className="h-4 w-2/5" />
            <Skeleton className="mt-2 h-3.5 w-3/5" />
            {mode === "grid" ? <Skeleton className="mt-3 h-3 w-1/2" /> : null}
          </div>
        </div>
      ))}
    </div>
  );
}

export function GroupViewMenu() {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  return (
    <MobileViewMenu
      label="Group view"
      value={mode}
      options={viewOptions}
      onChange={saveView}
    />
  );
}

export function GroupDesktopViewControls() {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");

  return (
    <div
      role="group"
      aria-label="Group view"
      className="inline-flex rounded-lg bg-surface-strong p-0.5"
    >
      {viewOptions.map(({ value, label, icon: Icon }) => (
        <button
          key={value}
          type="button"
          aria-label={`${label} view`}
          aria-pressed={mode === value}
          onClick={() => saveView(value)}
          className={`pressable grid h-8 w-8 place-items-center rounded-md ${mode === value ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}
        >
          <Icon aria-hidden size={value === "grid" ? 17 : 18} />
        </button>
      ))}
    </div>
  );
}

type GroupCollectionProps = {
  items: GroupCollectionItem[];
  nextCursor?: string | null;
  filters?: GroupFilterValues;
  error?: string;
};

export function GroupCollection(props: GroupCollectionProps) {
  const filters = props.filters ?? defaultGroupFilters;
  return (
    <GameResultsTransition>
      <GroupFilters
        filters={filters}
        error={props.error}
        viewControls={<GroupDesktopViewControls />}
      />
      {!props.error ? (
        <GroupResults
          key={groupFilterParams(filters).toString()}
          {...props}
          filters={filters}
        />
      ) : null}
    </GameResultsTransition>
  );
}

function GroupResults({
  items: initialItems,
  nextCursor: initialNextCursor = null,
  filters = defaultGroupFilters,
}: GroupCollectionProps) {
  const mode = useSyncExternalStore(subscribe, getView, (): ViewMode => "list");
  const [pending] = useGameResultsTransition();
  const query = groupFilterParams(filters).toString();
  const [items, setItems] = useState(initialItems);
  const [nextCursor, setNextCursor] = useState(initialNextCursor);
  const [previousItems, setPreviousItems] = useState(initialItems);
  if (previousItems !== initialItems) {
    setPreviousItems(initialItems);
    setItems(initialItems);
    setNextCursor(initialNextCursor);
  }
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const loadingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  useEffect(() => () => requestRef.current?.abort(), [initialItems]);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingRef.current || pending) return;
    const controller = new AbortController();
    requestRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(
        `/api/groups?${query ? `${query}&` : ""}cursor=${encodeURIComponent(nextCursor)}`,
        { cache: "no-store", signal: controller.signal }
      );
      if (!response.ok) throw new Error("request failed");
      const page = (await response.json()) as {
        items: GroupCollectionItem[];
        nextCursor: string | null;
      };
      if (controller.signal.aborted) return;
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      if (!controller.signal.aborted)
        setError("More groups couldn’t be loaded. Try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [nextCursor, query, pending]);

  useEffect(() => {
    const target = sentinelRef.current;
    if (!target || !nextCursor || typeof IntersectionObserver === "undefined")
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void loadMore();
      },
      { rootMargin: "320px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  const visibleItems = items;
  if (pending) return <GroupResultsSkeleton />;

  return (
    <div>
      <section aria-label="Your groups">
        {items.length ? (
          visibleItems.length ? (
            mode === "grid" ? (
              <div data-testid="groups-grid">
                <GroupGrid items={visibleItems} />
              </div>
            ) : (
              <div data-testid="groups-list">
                <GroupList items={visibleItems} />
              </div>
            )
          ) : (
            <EmptyGroups filtered={Boolean(query)} />
          )
        ) : (
          <EmptyGroups filtered={Boolean(query)} />
        )}
      </section>
      {items.length ? (
        <div
          ref={sentinelRef}
          className="flex min-h-20 items-center justify-center"
          aria-live="polite"
        >
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
            <p className="text-sm text-muted">
              All {items.length} groups loaded.
            </p>
          )}
        </div>
      ) : null}
      {error ? (
        <p
          role="alert"
          className="pb-4 text-center text-sm font-medium text-danger"
        >
          {error}
        </p>
      ) : null}
    </div>
  );
}
