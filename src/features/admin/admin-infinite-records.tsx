"use client";

import { ArrowRight } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { z } from "zod";

import { AdminDate, AdminStatus } from "@/features/admin/presentation";
import type {
  AdminAuditRecord,
  AdminFeedbackRecord,
  AdminPage,
  AdminRecord,
  AdminResource,
  AdminSessionRecord,
  AdminUserRecord,
  AdminVenueRecord,
} from "@/features/admin/records";
import {
  type FeedbackArea,
  feedbackAreaLabels,
  feedbackStatusLabels,
  feedbackTypeLabels,
} from "@/features/feedback/domain";
import { FeedbackStatusBadge } from "@/features/feedback/feedback-status";

const pageSchema = z.object({
  items: z.array(z.object({ id: z.string() }).passthrough()),
  nextCursor: z.string().nullable(),
});

type Props = {
  resource: AdminResource;
  initialPage: AdminPage<AdminRecord>;
  query?: string;
  status?: string;
  type?: string;
  emptyMessage: string;
};

function TableShell({ headers, children }: { headers: string[]; children: React.ReactNode }) {
  return (
    <div className="overflow-x-auto border-y border-line">
      <table className="w-full min-w-[820px] border-collapse text-left">
        <thead>
          <tr className="border-b border-line text-xs font-semibold text-muted">
            {headers.map((header, index) => (
              <th key={header || index} className={`px-3 py-3 ${header.startsWith("#") ? "text-right" : ""}`}>
                {header.startsWith("#") ? header.slice(1) : header || <span className="sr-only">Open</span>}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-line">{children}</tbody>
      </table>
    </div>
  );
}

function UserRows({ items }: { items: AdminUserRecord[] }) {
  return items.map((account) => (
    <tr key={account.id} className="hover:bg-surface-strong/60">
      <td className="px-3 py-3.5">
        <p className="font-semibold">{account.name ?? "Profile not finished"}</p>
        <p className="mt-1 text-xs text-muted">
          {account.email}
          {account.username ? ` · @${account.username}` : ""}
        </p>
      </td>
      <td className="px-3 py-3.5">
        <AdminStatus value={account.suspendedAt ? "suspended" : "active"} />
      </td>
      <td className="score px-3 py-3.5 text-right text-sm">{account.sessionsHosted}</td>
      <td className="px-3 py-3.5">
        <AdminDate value={account.createdAt} />
      </td>
      <td className="px-3 py-3.5 text-right">
        <Link
          href={`/admin/users/${account.id}`}
          aria-label={`Open ${account.name ?? account.email}`}
          className="inline-flex min-h-10 items-center font-semibold text-primary"
        >
          Open
        </Link>
      </td>
    </tr>
  ));
}

function SessionRows({ items }: { items: AdminSessionRecord[] }) {
  return items.map((game) => (
    <tr key={game.id} className="hover:bg-surface-strong/60">
      <td className="px-3 py-3.5">
        <p className="font-semibold">{game.title}</p>
        <p className="mt-1 text-xs text-muted">
          {game.venueName} · <AdminDate value={game.startsAt} />
        </p>
      </td>
      <td className="px-3 py-3.5">
        <p className="text-sm font-medium">{game.hostName ?? "Profile not finished"}</p>
        <p className="mt-1 text-xs text-muted">{game.hostEmail}</p>
      </td>
      <td className="px-3 py-3.5">
        <AdminStatus value={game.status} />
      </td>
      <td className="score px-3 py-3.5 text-right text-sm">
        {game.playerCount} / {game.capacity}
      </td>
      <td className="px-3 py-3.5 text-right">
        <Link
          href={`/admin/sessions/${game.id}`}
          aria-label={`Open ${game.title}`}
          className="inline-flex min-h-10 items-center font-semibold text-primary"
        >
          Open
        </Link>
      </td>
    </tr>
  ));
}

function VenueRows({ items }: { items: AdminVenueRecord[] }) {
  return items.map((venue) => (
    <tr key={venue.id} className="hover:bg-surface-strong/60">
      <td className="px-3 py-3.5">
        <p className="font-semibold">{venue.name}</p>
        <p className="mt-1 max-w-md text-xs leading-5 text-muted">{venue.address}</p>
      </td>
      <td className="px-3 py-3.5 text-sm text-muted">{venue.source}</td>
      <td className="px-3 py-3.5">
        <AdminStatus value={venue.listingStatus} />
      </td>
      <td className="score px-3 py-3.5 text-right text-sm">{venue.courtCount ?? "—"}</td>
      <td className="px-3 py-3.5 text-right">
        <Link
          href={`/admin/venues/${venue.id}`}
          aria-label={`Open ${venue.name}`}
          className="inline-flex min-h-10 items-center font-semibold text-primary"
        >
          Open
        </Link>
      </td>
    </tr>
  ));
}

function AuditRows({ items }: { items: AdminAuditRecord[] }) {
  return items.map((entry) => (
    <tr key={entry.id} className="align-top">
      <td className="px-3 py-4">
        <span className="rounded-md bg-surface-strong px-2 py-1 text-xs font-semibold">{entry.action}</span>
      </td>
      <td className="px-3 py-4">
        <p className="text-sm font-medium">{entry.actorName ?? entry.actorEmail}</p>
        <p className="mt-1 text-xs text-muted">{entry.actorEmail}</p>
      </td>
      <td className="px-3 py-4">
        <p className="text-sm font-medium capitalize">{entry.targetType}</p>
        <p className="score mt-1 text-xs text-muted">{entry.targetId.slice(0, 12)}</p>
      </td>
      <td className="max-w-sm px-3 py-4 text-sm leading-6 text-muted">{entry.reason ?? "—"}</td>
      <td className="px-3 py-4">
        <AdminDate value={entry.createdAt} includeTime />
      </td>
    </tr>
  ));
}

function FeedbackRows({ items }: { items: AdminFeedbackRecord[] }) {
  return (
    <ol className="divide-y divide-line border-y border-line">
      {items.map((item) => (
        <li key={item.id}>
          <Link
            href={`/admin/feedback/${item.id}`}
            className="pressable flex min-h-20 items-center gap-4 py-4 hover:bg-surface-strong sm:px-2"
          >
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-semibold">{item.title}</p>
                <span className="text-xs font-semibold text-muted">
                  {feedbackTypeLabels[item.type as keyof typeof feedbackTypeLabels] ?? item.type}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted">
                {feedbackAreaLabels[item.area as FeedbackArea] ?? item.area} ·{" "}
                {item.submitterName ?? item.submitterEmail}
              </p>
              <div className="mt-2 sm:hidden">
                <FeedbackStatusBadge status={item.status as keyof typeof feedbackStatusLabels} />
              </div>
            </div>
            <div className="hidden text-right sm:block">
              <AdminDate value={item.createdAt} />
              <p className="mt-1 text-xs text-muted">
                {feedbackStatusLabels[item.status as keyof typeof feedbackStatusLabels] ?? item.status}
              </p>
            </div>
            <ArrowRight aria-hidden size={17} className="shrink-0 text-muted" />
          </Link>
        </li>
      ))}
    </ol>
  );
}

export function AdminInfiniteRecords({
  resource,
  initialPage,
  query = "",
  status = "",
  type = "",
  emptyMessage,
}: Props) {
  const [items, setItems] = useState<AdminRecord[]>(initialPage.items);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const sentinel = useRef<HTMLDivElement>(null);
  const loadingRef = useRef(false);

  const loadMore = useCallback(async () => {
    if (!nextCursor || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    setError(null);
    const params = new URLSearchParams({ cursor: nextCursor });
    if (query) params.set("q", query);
    if (status) params.set("status", status);
    if (type) params.set("type", type);
    try {
      const response = await fetch(`/api/admin/${resource}?${params}`, {
        credentials: "same-origin",
        headers: { Accept: "application/json" },
      });
      if (!response.ok)
        throw new Error(
          response.status === 429 ? "Request limit reached. Try again shortly." : "More records could not be loaded.",
        );
      const parsed = pageSchema.safeParse(await response.json());
      if (!parsed.success) throw new Error("The server returned an invalid page.");
      const incoming = parsed.data.items as unknown as AdminRecord[];
      setItems((current) => {
        const ids = new Set(current.map((item) => item.id));
        return [...current, ...incoming.filter((item) => !ids.has(item.id))];
      });
      setNextCursor(parsed.data.nextCursor);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "More records could not be loaded.");
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, [nextCursor, query, resource, status, type]);

  useEffect(() => {
    const target = sentinel.current;
    if (!target || !nextCursor) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting) void loadMore();
      },
      { rootMargin: "320px 0px" },
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [loadMore, nextCursor]);

  const content =
    resource === "users" ? (
      <TableShell headers={["User", "Status", "#Hosted", "Joined", ""]}>
        <UserRows items={items as AdminUserRecord[]} />
      </TableShell>
    ) : resource === "sessions" ? (
      <TableShell headers={["Game", "Host", "Status", "#Players", ""]}>
        <SessionRows items={items as AdminSessionRecord[]} />
      </TableShell>
    ) : resource === "venues" ? (
      <TableShell headers={["Venue", "Source", "Status", "#Courts", ""]}>
        <VenueRows items={items as AdminVenueRecord[]} />
      </TableShell>
    ) : resource === "audit" ? (
      <TableShell headers={["Action", "Administrator", "Target", "Reason", "Time"]}>
        <AuditRows items={items as AdminAuditRecord[]} />
      </TableShell>
    ) : (
      <FeedbackRows items={items as AdminFeedbackRecord[]} />
    );

  if (!items.length)
    return (
      <div className="border-y border-line py-10 text-center">
        <p className="text-sm font-semibold">{emptyMessage}</p>
      </div>
    );

  return (
    <div>
      {content}
      <div ref={sentinel} className="min-h-14">
        {loading ? (
          <p role="status" className="flex items-center justify-center gap-2 py-5 text-sm text-muted">
            <span className="h-4 w-4 animate-spin rounded-full border-2 border-line border-t-primary motion-reduce:animate-none" />
            Loading more records…
          </p>
        ) : null}
        {error ? (
          <div role="alert" className="flex items-center justify-center gap-3 py-4 text-sm text-muted">
            <span>{error}</span>
            <button type="button" onClick={() => void loadMore()} className="font-semibold text-primary">
              Retry
            </button>
          </div>
        ) : null}
        {!nextCursor && !error ? (
          <p role="status" className="py-4 text-center text-xs text-muted">
            All {items.length} matching records loaded.
          </p>
        ) : null}
      </div>
    </div>
  );
}
