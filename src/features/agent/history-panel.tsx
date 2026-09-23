"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/content-state";
import { notify } from "@/components/ui/action-notice";
import { Button } from "@/components/ui/button";
import { Tooltip } from "@/components/ui/tooltip";
import { AgentChatPickerTrigger } from "./chat-presentation";
import { chatAge } from "./history-age";
import { historyRequest } from "./history-client";
import type { AgentConversationSummary } from "./history-types";

export function AgentHistoryPanel({
  disabled,
  activeId,
  activeTitle,
  onSelect,
}: {
  disabled: boolean;
  activeId: string | null;
  activeTitle: string;
  onSelect: (id: string) => Promise<void>;
}) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const panelId = useId();
  const [open, setOpen] = useState(false);
  const [rows, setRows] = useState<AgentConversationSummary[]>([]);
  const [loading, setLoading] = useState(false);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
    };
  }, [open]);
  async function load() {
    setLoading(true);
    setFailed(false);
    try {
      const result = await historyRequest<{
        conversations: AgentConversationSummary[];
      }>();
      setRows(result.conversations.slice(0, 6));
    } catch {
      setFailed(true);
      notify("Couldn’t load recent chats. Please try again.");
    } finally {
      setLoading(false);
    }
  }
  return (
    <div
      ref={root}
      role="group"
      className="relative min-w-0 max-w-full"
      onBlur={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setOpen(false);
      }}
    >
      <AgentChatPickerTrigger
        title={activeTitle}
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={`Chat history: ${activeTitle}`}
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => {
          setOpen(!open);
          if (!open) void load();
        }}
      />
      {open ? (
        <div
          id={panelId}
          className="absolute left-0 top-full z-30 mt-1 flex max-h-[min(24rem,calc(100dvh-8rem))] w-80 max-w-[calc(100vw-5rem)] flex-col overflow-hidden rounded-xl border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
        >
          <div className="min-h-0 overflow-y-auto overscroll-contain">
            {loading ? (
              <p
                role="status"
                className="text-shimmer px-3 py-3 text-sm text-muted"
              >
                Loading…
              </p>
            ) : failed ? (
              <Button
                variant="quiet"
                onClick={() => {
                  void load();
                }}
              >
                Try again
              </Button>
            ) : rows.length ? (
              <ul aria-label="Recent chats">
                {rows.map((row) => (
                  <li key={row.id}>
                    <button
                      type="button"
                      aria-current={row.id === activeId ? "true" : undefined}
                      className="flex min-h-10 w-full items-center gap-4 rounded-lg px-3 py-2 text-left text-sm hover:bg-surface-strong"
                      onClick={() => {
                        setOpen(false);
                        trigger.current?.focus();
                        void onSelect(row.id);
                      }}
                    >
                      <span className="min-w-0 flex-1 truncate py-0.5 leading-5">
                        {row.title}
                      </span>
                      <Tooltip
                        content={row.title}
                        side="bottom"
                        align="center"
                      />
                      <time
                        aria-label={chatAge(row.updatedAt, undefined, true)}
                        dateTime={row.updatedAt}
                        className="shrink-0 text-xs tabular-nums text-muted"
                      >
                        {chatAge(row.updatedAt)}
                      </time>
                    </button>
                  </li>
                ))}
              </ul>
            ) : (
              <EmptyState
                compact
                icon="chat"
                title="No saved chats yet."
                description="Your conversations will appear here."
              />
            )}
          </div>
          <div className="mt-1 shrink-0 border-t border-line pt-1">
            <Link
              href="/agent/history"
              onClick={() => setOpen(false)}
              className="flex min-h-10 w-full items-center rounded-lg px-3 py-2 text-sm leading-5 text-muted hover:bg-surface-strong hover:text-ink"
            >
              See all chats
            </Link>
          </div>
        </div>
      ) : null}
    </div>
  );
}
