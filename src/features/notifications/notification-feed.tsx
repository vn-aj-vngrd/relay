"use client";

import { Bell, CalendarCheck, CaretRight, CurrencyCircleDollar, Trophy, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { openNotification } from "./actions";
import {
  type NotificationGroup,
  notificationGroup,
  notificationPresentation,
  notificationTime,
  type NotificationTone,
} from "./domain";
import type { NotificationFeedItem, NotificationFilter, NotificationPage } from "./queries";

const groupOrder: NotificationGroup[] = ["Today", "This week", "Earlier"];
const toneIcons = {
  session: CalendarCheck,
  players: UsersThree,
  payment: CurrencyCircleDollar,
  play: Trophy,
  system: Bell,
} satisfies Record<NotificationTone, typeof Bell>;

export function NotificationFeed({
  initialPage,
  filter,
}: {
  initialPage: NotificationPage;
  filter: NotificationFilter;
}) {
  const [items, setItems] = useState(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const sentinelRef = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError("");
    try {
      const params = new URLSearchParams({ filter, cursor: nextCursor });
      const response = await fetch(`/api/notifications?${params}`, { cache: "no-store" });
      if (!response.ok) throw new Error("request failed");
      const page = (await response.json()) as NotificationPage;
      setItems((current) => {
        const seen = new Set(current.map((item) => item.id));
        return [...current, ...page.items.filter((item) => !seen.has(item.id))];
      });
      setNextCursor(page.nextCursor);
    } catch {
      setError("Older notifications couldn’t be loaded. Try again.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [filter, nextCursor]);

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

  const grouped = useMemo(() => {
    const groups = new Map<NotificationGroup, NotificationFeedItem[]>();
    for (const item of items) {
      const group = notificationGroup(new Date(item.createdAt));
      groups.set(group, [...(groups.get(group) ?? []), item]);
    }
    return groups;
  }, [items]);

  if (!items.length) return <NotificationEmpty filter={filter} />;

  return (
    <div className="pt-2">
      {groupOrder.map((group) => {
        const groupItems = grouped.get(group);
        if (!groupItems?.length) return null;
        const headingId = `notifications-${group.replaceAll(" ", "-").toLowerCase()}`;
        return (
          <section key={group} aria-labelledby={headingId} className="pt-7">
            <h2 id={headingId} className="px-1 text-xs font-semibold uppercase tracking-[0.04em] text-muted">
              {group}
            </h2>
            <div className="mt-2 divide-y divide-line border-y border-line">
              {groupItems.map((item) => {
                const presentation = notificationPresentation({
                  type: item.type,
                  sessionId: item.sessionId,
                  sessionTitle: item.sessionTitle,
                  payload: item.payload,
                });
                const Icon = toneIcons[presentation.tone];
                const unread = !item.readAt;
                const createdAt = new Date(item.createdAt);
                return (
                  <form
                    noValidate
                    action={openNotification}
                    key={item.id}
                    className="[content-visibility:auto] [contain-intrinsic-size:auto_80px]"
                  >
                    <input type="hidden" name="notificationId" value={item.id} />
                    <button
                      type="submit"
                      className="pressable group relative flex min-h-20 w-full items-start gap-3 px-1 py-4 text-left hover:bg-surface-strong/45 sm:px-3"
                    >
                      <span
                        className={`mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-full ${unread ? "bg-primary-soft text-primary" : "bg-surface-strong text-muted"}`}
                      >
                        <Icon aria-hidden size={17} weight={unread ? "fill" : "regular"} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="flex items-start gap-2">
                          <strong className="text-sm font-semibold leading-5 text-ink">{presentation.title}</strong>
                          {unread ? (
                            <span
                              role="img"
                              className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-primary"
                              aria-label="Unread"
                            />
                          ) : null}
                        </span>
                        <span className="mt-1 block max-w-2xl text-sm leading-5 text-muted">{presentation.body}</span>
                      </span>
                      <span className="flex shrink-0 items-center gap-2 pt-0.5">
                        <time dateTime={item.createdAt} className="score text-[11px] text-muted">
                          {notificationTime(createdAt, group)}
                        </time>
                        <CaretRight
                          aria-hidden
                          size={13}
                          className="text-muted transition-transform group-hover:translate-x-0.5"
                        />
                      </span>
                    </button>
                  </form>
                );
              })}
            </div>
          </section>
        );
      })}
      <div ref={sentinelRef} className="flex min-h-20 items-center justify-center" aria-live="polite">
        {nextCursor ? (
          <button
            type="button"
            onClick={() => void loadMore()}
            disabled={loading}
            className="pressable min-h-11 rounded-lg px-4 text-sm font-semibold text-primary hover:bg-primary-soft disabled:text-muted"
          >
            {loading ? "Loading older updates…" : "Load older updates"}
          </button>
        ) : (
          <p className="text-sm text-muted">You’ve reached the first update.</p>
        )}
      </div>
      {error ? (
        <p role="alert" className="pb-4 text-center text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  );
}

function NotificationEmpty({ filter }: { filter: NotificationFilter }) {
  return (
    <section className="mt-8 border-y border-line py-12 text-center">
      <span className="mx-auto grid h-10 w-10 place-items-center rounded-full bg-surface-strong text-muted">
        <Bell aria-hidden size={19} />
      </span>
      <h2 className="mt-4 text-lg font-bold">{filter === "unread" ? "No unread updates" : "Nothing here yet"}</h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-muted">
        {filter === "unread"
          ? "New invites, roster changes, payment updates, and court assignments will appear here."
          : "Game invites, roster changes, payments, and court assignments will appear here."}
      </p>
      {filter === "unread" ? (
        <Link href="/notifications" className="mt-5 inline-flex min-h-10 items-center font-semibold text-primary">
          View all notifications
        </Link>
      ) : null}
    </section>
  );
}
