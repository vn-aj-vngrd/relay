"use client";

import { ArrowLeft } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/content-state";
import { Skeleton } from "@/components/shared/skeleton";
import { notify } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { AgentHistoryActions } from "./history-actions";
import { chatAge } from "./history-age";
import { historyRequest, loadConversation } from "./history-client";
import { AgentHistoryStatus } from "./history-status";
import type { AgentConversationSummary } from "./history-types";
import { useAgentSession } from "./session";

type HistoryPage = {
  conversations: AgentConversationSummary[];
  hasMore: boolean;
};

function HistoryRowsSkeleton() {
  return (
    <div role="status" aria-label="Loading chats" aria-busy="true">
      <div aria-hidden="true" className="divide-y divide-line">
        {Array.from({ length: 5 }, (_, index) => (
          <div
            key={index}
            className="flex min-h-14 items-center gap-1 px-1 sm:gap-2"
          >
            <div className="flex min-h-11 min-w-0 flex-1 items-center px-2">
              <Skeleton
                className={index % 2 === 0 ? "h-3.5 w-14" : "h-3.5 w-20"}
              />
            </div>
            <div className="flex shrink-0 items-center gap-1">
              <Skeleton className="size-3.5 rounded-full" />
              <Skeleton className="h-3 w-[30px]" />
            </div>
            <div className="shrink-0 px-1">
              <Skeleton className="h-3 w-[26px]" />
            </div>
            <div className="flex size-9 shrink-0 items-center justify-center">
              <Skeleton className="h-1 w-4" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AgentHistoryCollection() {
  const router = useRouter();
  const session = useAgentSession();
  const activeId = session.conversationId;
  const [mutating, setMutating] = useState(false);
  async function onSelect(id: string) {
    if (session.activity === "working" && id !== session.conversationId) {
      notify("Wait for Agent to finish before opening another chat.");
      return;
    }
    if (id !== session.conversationId) {
      if (session.chat) {
        session.chat.messages = [];
        session.chat.clearError();
      }
      session.conversationId = null;
      session.draft = "";
    }
    router.push(`/agent?chat=${id}`);
  }
  function onDelete(id: string) {
    if (session.conversationId !== id) return;
    void session.chat?.stop();
    if (session.chat) session.chat.messages = [];
    session.conversationId = null;
    session.draft = "";
    session.title = "Your chats";
  }
  function onRename(row: AgentConversationSummary) {
    if (row.id === session.conversationId) session.title = row.title;
  }
  const [rows, setRows] = useState<AgentConversationSummary[]>([]);
  const [tab, setTab] = useState<"active" | "archived">("active");
  const panelId = useId();
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const sentinel = useRef<HTMLDivElement>(null);
  const viewport = useRef<HTMLDivElement>(null);
  const titleField = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (editing) {
      titleField.current?.focus();
      titleField.current?.select();
    }
  }, [editing]);
  const cursor = useRef<AgentConversationSummary | null>(null);
  const request = useRef<AbortController | null>(null);
  const load = useCallback(
    async (more = false) => {
      if (request.current) return;
      const controller = new AbortController();
      request.current = controller;
      setLoading(true);
      setFailed(false);
      try {
        const last = more ? cursor.current : null;
        const params = new URLSearchParams();
        if (tab === "archived") params.set("archived", "true");
        if (last) {
          params.set("before", last.updatedAt);
          params.set("id", last.id);
        }
        const page = await historyRequest<HistoryPage>(
          params.size ? `?${params}` : "",
          { signal: controller.signal }
        );
        if (controller.signal.aborted) return;
        cursor.current = page.conversations.at(-1) ?? last;
        setRows((current) => {
          if (!more) return page.conversations;
          const seen = new Set(current.map((row) => row.id));
          return [
            ...current,
            ...page.conversations.filter((row) => !seen.has(row.id)),
          ];
        });
        setHasMore(
          page.hasMore &&
            page.conversations.length > 0 &&
            (!last ||
              cursor.current?.id !== last.id ||
              cursor.current?.updatedAt !== last.updatedAt)
        );
      } catch {
        if (!controller.signal.aborted) {
          setFailed(true);
          notify("Couldn’t load chat history. Please try again.");
        }
      } finally {
        if (request.current === controller) request.current = null;
        if (!controller.signal.aborted) setLoading(false);
      }
    },
    [tab]
  );
  useEffect(() => {
    cursor.current = null;
    setRows([]);
    setHasMore(false);
    void load();
    return () => {
      request.current?.abort();
      request.current = null;
    };
  }, [load]);
  useEffect(() => {
    const target = sentinel.current;
    if (
      !target ||
      !hasMore ||
      loading ||
      failed ||
      mutating ||
      editing ||
      typeof IntersectionObserver === "undefined"
    )
      return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) void load(true);
      },
      { root: viewport.current, rootMargin: "320px 0px" }
    );
    observer.observe(target);
    return () => observer.disconnect();
  }, [hasMore, loading, failed, mutating, editing, load]);
  useEffect(() => {
    const needsRefresh = (row: AgentConversationSummary) =>
      row.status === "working" ||
      (row.id === activeId &&
        session.activity !== "idle" &&
        row.status === "idle");
    if (!rows.some(needsRefresh)) return;
    const timer = window.setInterval(() => {
      for (const row of rows) {
        if (!needsRefresh(row)) continue;
        void loadConversation(row.id)
          .then((saved) => {
            setRows((current) =>
              current.map((item) =>
                item.id === saved.id
                  ? {
                      ...item,
                      status: saved.status,
                      updatedAt: saved.updatedAt,
                    }
                  : item
              )
            );
          })
          .catch(() => {});
      }
    }, 3000);
    return () => window.clearInterval(timer);
  }, [rows, activeId, session.activity]);
  async function rename(id: string) {
    if (!title.trim()) return;
    setMutating(true);
    try {
      const row = await historyRequest<AgentConversationSummary>(`/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ title: title.trim() }),
      });
      setRows((current) =>
        current.map((item) => (item.id === id ? row : item))
      );
      setEditing(null);
      onRename(row);
      notify("Chat renamed.", "success");
    } catch {
      notify("Couldn’t rename this chat. Please try again.");
    } finally {
      setMutating(false);
    }
  }
  async function remove(id: string) {
    setMutating(true);
    try {
      await historyRequest(`/${id}`, { method: "DELETE" });
      setRows((current) => current.filter((item) => item.id !== id));
      onDelete(id);
      notify("Chat deleted.", "success");
    } catch {
      notify("Couldn’t delete this chat. Please try again.");
    } finally {
      setMutating(false);
    }
  }
  async function setArchived(id: string, archived: boolean) {
    setMutating(true);
    try {
      await historyRequest(`/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ archived }),
      });
      setRows((current) => current.filter((item) => item.id !== id));
      if (archived && session.conversationId === id) onDelete(id);
      notify(archived ? "Chat archived." : "Chat restored.", "success");
    } catch {
      notify(
        `Couldn’t ${archived ? "archive" : "restore"} this chat. Please try again.`
      );
    } finally {
      setMutating(false);
    }
  }
  return (
    <section className="agent-history-page mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <header className="shrink-0 border-b border-line">
        <div className="flex items-center gap-2">
          <Link
            href="/agent"
            aria-label="Back to chat"
            className="back-control pressable -ml-3 inline-flex size-11 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink"
          >
            <ArrowLeft size={18} aria-hidden />
            <Tooltip content="Back to chat" side="bottom" align="center" />
          </Link>
          <h1 className="text-xl font-semibold tracking-tight">Chat history</h1>
        </div>
        <div
          role="tablist"
          aria-label="Chat history"
          className="mt-2 flex"
          onKeyDown={(event) => {
            if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key))
              return;
            event.preventDefault();
            const next =
              event.key === "ArrowLeft" || event.key === "Home"
                ? "active"
                : "archived";
            setEditing(null);
            setTab(next);
            document.getElementById(`${panelId}-${next}`)?.focus();
          }}
        >
          {(["active", "archived"] as const).map((item) => (
            <button
              key={item}
              type="button"
              role="tab"
              id={`${panelId}-${item}`}
              aria-controls={panelId}
              aria-selected={tab === item}
              tabIndex={tab === item ? 0 : -1}
              className={`compact-control tab-chip pressable relative inline-flex min-h-11 items-center px-3 text-sm font-semibold ${tab === item ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}
              onClick={() => {
                setEditing(null);
                setTab(item);
              }}
            >
              {item === "active" ? "Chats" : "Archived"}
            </button>
          ))}
        </div>
      </header>
      <div
        ref={viewport}
        id={panelId}
        role="tabpanel"
        aria-labelledby={`${panelId}-${tab}`}
        tabIndex={0}
        className="agent-conversation-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-2"
      >
        {loading && !rows.length ? <HistoryRowsSkeleton /> : null}
        {!loading && !rows.length && !failed ? (
          <EmptyState
            icon="chat"
            title={
              tab === "archived"
                ? "No archived chats"
                : "No saved conversations"
            }
            description={
              tab === "archived"
                ? "Chats you archive will appear here."
                : "Your first conversation will appear here."
            }
          >
            {tab === "active" ? (
              <Link
                href="/agent"
                className="inline-flex min-h-10 items-center text-sm text-primary"
              >
                Start a conversation
              </Link>
            ) : null}
          </EmptyState>
        ) : null}
        <ul
          aria-label={tab === "archived" ? "Archived chats" : "Saved chats"}
          className="divide-y divide-line"
        >
          {rows.map((row) => (
            <li
              key={row.id}
              className="[content-visibility:auto] [contain-intrinsic-size:auto_56px]"
            >
              {editing === row.id ? (
                <form
                  noValidate
                  onSubmit={(event) => {
                    event.preventDefault();
                    void rename(row.id);
                  }}
                  className="space-y-2 px-2 py-3"
                >
                  <label
                    className="text-sm font-medium"
                    htmlFor="agent-chat-title"
                  >
                    Chat title
                  </label>
                  <input
                    ref={titleField}
                    id="agent-chat-title"
                    className="field"
                    value={title}
                    maxLength={100}
                    onChange={(event) => setTitle(event.target.value)}
                    disabled={mutating}
                    onKeyDown={(event) => {
                      if (event.key === "Escape" && !mutating) setEditing(null);
                    }}
                  />
                  <div className="flex gap-2">
                    <Button type="submit" disabled={mutating || !title.trim()}>
                      Save title
                    </Button>
                    <Button
                      type="button"
                      variant="quiet"
                      disabled={mutating}
                      onClick={() => setEditing(null)}
                    >
                      Cancel
                    </Button>
                  </div>
                </form>
              ) : (
                <div className="group flex min-h-14 items-center gap-1 px-1 hover:bg-surface-strong/50 focus-within:bg-surface-strong/50 sm:gap-2">
                  <button
                    type="button"
                    aria-current={row.id === activeId ? "true" : undefined}
                    disabled={mutating}
                    className="flex min-h-11 min-w-0 flex-1 items-center rounded-lg px-2 text-left text-sm hover:text-primary disabled:opacity-50"
                    onClick={async () => {
                      await onSelect(row.id);
                    }}
                  >
                    <span className="min-w-0 truncate py-0.5 font-medium leading-5">
                      {row.title}
                    </span>
                  </button>
                  <AgentHistoryStatus
                    status={
                      row.id === activeId && session.activity === "working"
                        ? "working"
                        : (row.status ?? "idle")
                    }
                  />
                  <time
                    aria-label={chatAge(row.updatedAt, undefined, true)}
                    dateTime={row.updatedAt}
                    className="shrink-0 px-1 text-xs tabular-nums text-muted"
                  >
                    {chatAge(row.updatedAt)}
                  </time>
                  <AgentHistoryActions
                    row={row}
                    disabled={
                      loading ||
                      mutating ||
                      (session.activity === "working" && row.id === activeId)
                    }
                    onRename={() => {
                      setEditing(row.id);
                      setTitle(row.title);
                    }}
                    onArchive={() => void setArchived(row.id, !row.archivedAt)}
                    onDelete={() => void remove(row.id)}
                  />
                </div>
              )}
            </li>
          ))}
        </ul>
        <div ref={sentinel} className="min-h-14 py-3 text-center">
          {failed ? (
            <Button
              variant="secondary"
              disabled={loading || mutating}
              onClick={() => {
                void load(cursor.current !== null);
              }}
            >
              Retry history
            </Button>
          ) : loading && rows.length ? (
            <p role="status" className="text-shimmer text-sm text-muted">
              Loading older chats…
            </p>
          ) : hasMore ? (
            <Button
              variant="quiet"
              disabled={mutating}
              onClick={() => {
                void load(true);
              }}
            >
              Load older chats
            </Button>
          ) : null}
        </div>
      </div>
    </section>
  );
}
