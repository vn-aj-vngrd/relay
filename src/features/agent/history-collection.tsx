"use client";
import {
  ArrowLeft,
  ChatCircle,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { ConfirmActionButton } from "@/components/shared/confirm-action-button";
import { notify } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { chatAge } from "./history-age";
import { historyRequest } from "./history-client";
import type { AgentConversationSummary } from "./history-types";
import { useAgentSession } from "./session";

type HistoryPage = {
  conversations: AgentConversationSummary[];
  hasMore: boolean;
};
export function AgentHistoryCollection() {
  const router = useRouter();
  const session = useAgentSession();
  const activeId = session.conversationId;
  const [mutating, setMutating] = useState(false);
  async function onSelect(id: string) {
    if (id !== session.conversationId) {
      await session.chat?.stop();
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
  const load = useCallback(async (more = false) => {
    if (request.current) return;
    const controller = new AbortController();
    request.current = controller;
    setLoading(true);
    setFailed(false);
    try {
      const last = more ? cursor.current : null;
      const page = await historyRequest<HistoryPage>(
        last
          ? `?before=${encodeURIComponent(last.updatedAt)}&id=${encodeURIComponent(last.id)}`
          : "",
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
  }, []);
  useEffect(() => {
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
  return (
    <section className="agent-history-page mx-auto flex h-full min-h-0 w-full max-w-3xl flex-col">
      <header className="shrink-0 border-b border-line pb-4">
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
        <p className="mt-1 text-sm leading-5 text-muted">
          Your saved conversations.
        </p>
      </header>
      <div
        ref={viewport}
        role="region"
        aria-label="Chat history list"
        tabIndex={0}
        className="agent-conversation-scroll min-h-0 flex-1 overflow-y-auto overscroll-contain py-2"
      >
        {loading && !rows.length ? (
          <p
            role="status"
            className="text-shimmer px-2 py-6 text-sm text-muted"
          >
            Loading chats…
          </p>
        ) : null}
        {!loading && !rows.length && !failed ? (
          <div className="py-12 text-center">
            <ChatCircle
              size={28}
              className="mx-auto mb-3 text-muted"
              aria-hidden
            />
            <p className="text-sm text-muted">
              Your first conversation will appear here.
            </p>
            <Link
              href="/agent"
              className="mt-3 inline-flex min-h-10 items-center text-sm text-primary"
            >
              Start a conversation
            </Link>
          </div>
        ) : null}
        <ul aria-label="Saved chats" className="divide-y divide-line">
          {rows.map((row) => (
            <li
              key={row.id}
              className="[content-visibility:auto] [contain-intrinsic-size:auto_64px]"
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
                <div className="flex min-h-16 items-center gap-1 px-1 sm:gap-2">
                  <button
                    type="button"
                    aria-current={row.id === activeId ? "true" : undefined}
                    disabled={mutating}
                    className="flex min-h-11 min-w-0 flex-1 items-center gap-3 rounded-lg px-1 text-left text-sm hover:text-primary disabled:opacity-50"
                    onClick={async () => {
                      await onSelect(row.id);
                    }}
                  >
                    <ChatCircle
                      size={18}
                      className="hidden shrink-0 text-muted sm:block"
                      aria-hidden
                    />
                    <span className="min-w-0 truncate py-0.5 font-medium leading-5">
                      {row.title}
                    </span>
                    <Tooltip content={row.title} side="top" align="start" />
                  </button>
                  <time
                    aria-label={chatAge(row.updatedAt, undefined, true)}
                    dateTime={row.updatedAt}
                    className="shrink-0 px-1 text-xs tabular-nums text-muted"
                  >
                    {chatAge(row.updatedAt)}
                  </time>
                  <button
                    type="button"
                    disabled={loading || mutating}
                    aria-label={`Rename ${row.title}`}
                    className="pressable inline-flex size-9 shrink-0 items-center justify-center rounded-lg text-muted hover:text-ink disabled:opacity-45"
                    onClick={() => {
                      setEditing(row.id);
                      setTitle(row.title);
                    }}
                  >
                    <PencilSimple size={16} aria-hidden />
                    <Tooltip
                      content="Rename chat"
                      side="bottom"
                      align="center"
                    />
                  </button>
                  <ConfirmActionButton
                    variant="quiet"
                    className="w-9 shrink-0 px-0! text-muted hover:bg-transparent! hover:text-danger"
                    disabled={loading || mutating}
                    aria-label={`Delete ${row.title}`}
                    confirmTitle="Delete this chat?"
                    confirmText="This permanently deletes this conversation from your Relay account."
                    confirmLabel="Delete chat"
                    cancelLabel="Keep chat"
                    onConfirm={() => {
                      void remove(row.id);
                    }}
                  >
                    <Trash size={16} aria-hidden />
                    <Tooltip
                      content="Delete chat"
                      side="bottom"
                      align="center"
                    />
                  </ConfirmActionButton>
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
