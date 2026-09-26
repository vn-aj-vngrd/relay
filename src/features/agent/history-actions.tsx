"use client";

import {
  Archive,
  ArrowUUpLeft,
  DotsThree,
  PencilSimple,
  Trash,
} from "@phosphor-icons/react";
import { useEffect, useId, useRef } from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { Tooltip } from "@/components/ui/tooltip";
import { usePopoverTransition } from "@/components/ui/use-popover-transition";
import type { AgentConversationSummary } from "./history-types";

export function AgentHistoryActions({
  row,
  disabled,
  onRename,
  onArchive,
  onDelete,
}: {
  row: AgentConversationSummary;
  disabled: boolean;
  onRename: () => void;
  onArchive: () => void;
  onDelete: () => void;
}) {
  const { open, rendered, hide, toggle } = usePopoverTransition();
  const root = useRef<HTMLDivElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const dialog = useRef<HTMLDialogElement>(null);
  const menuId = useId();
  const titleId = useId();
  const descriptionId = useId();
  useEffect(() => {
    if (open) menu.current?.querySelector("button")?.focus();
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const outside = (event: PointerEvent) => {
      if (
        !root.current?.contains(event.target as Node) &&
        !menu.current?.contains(event.target as Node)
      )
        hide();
    };
    const escape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        hide();
        trigger.current?.focus();
      }
    };
    document.addEventListener("pointerdown", outside);
    document.addEventListener("keydown", escape);
    document.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerdown", outside);
      document.removeEventListener("keydown", escape);
      document.removeEventListener("scroll", hide, true);
    };
  }, [hide, open]);
  const actionClass =
    "pressable flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm hover:bg-surface-strong";
  return (
    <div ref={root} className="relative shrink-0">
      <button
        ref={trigger}
        type="button"
        disabled={disabled}
        aria-label={`More actions for ${row.title}`}
        aria-expanded={open}
        aria-controls={menuId}
        className="pressable inline-flex size-9 items-center justify-center rounded-lg text-muted hover:text-ink disabled:opacity-45"
        onClick={toggle}
      >
        <DotsThree size={18} weight="bold" aria-hidden />
        <Tooltip content="Chat actions" side="bottom" />
      </button>
      {rendered && typeof document !== "undefined"
        ? createPortal(
            <div
              ref={menu}
              role="menu"
              id={menuId}
              data-state={open ? "open" : "closed"}
              onBlur={(event) => {
                if (
                  !menu.current?.contains(event.relatedTarget) &&
                  !root.current?.contains(event.relatedTarget)
                )
                  hide();
              }}
              style={(() => {
                const rect = trigger.current?.getBoundingClientRect();
                return rect
                  ? {
                      position: "fixed" as const,
                      right: Math.max(8, window.innerWidth - rect.right),
                      ...(window.innerHeight - rect.bottom < 160
                        ? { bottom: window.innerHeight - rect.top + 4 }
                        : { top: rect.bottom + 4 }),
                    }
                  : undefined;
              })()}
              className="menu-popover z-50 min-w-40 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
            >
              <button
                type="button"
                role="menuitem"
                className={actionClass}
                onClick={() => {
                  hide();
                  onRename();
                }}
              >
                <PencilSimple size={16} aria-hidden /> Rename
              </button>
              <button
                type="button"
                role="menuitem"
                className={actionClass}
                disabled={row.status === "working"}
                onClick={() => {
                  hide();
                  onArchive();
                }}
              >
                {row.archivedAt ? (
                  <ArrowUUpLeft size={16} aria-hidden />
                ) : (
                  <Archive size={16} aria-hidden />
                )}
                {row.archivedAt ? "Restore" : "Archive"}
              </button>
              <button
                type="button"
                role="menuitem"
                className={`${actionClass} text-danger`}
                disabled={row.status === "working"}
                onClick={() => {
                  hide();
                  dialog.current?.showModal();
                }}
              >
                <Trash size={16} aria-hidden /> Delete
              </button>
            </div>,
            document.body
          )
        : null}
      <Dialog
        ref={dialog}
        aria-labelledby={titleId}
        aria-describedby={descriptionId}
      >
        <div className="p-5 sm:p-6">
          <h2 id={titleId} className="text-lg font-semibold">
            Delete this chat?
          </h2>
          <p id={descriptionId} className="mt-2 text-sm leading-6 text-muted">
            This permanently deletes this conversation from your Relay account.
          </p>
          <div className="mt-7 flex justify-end gap-2">
            <Button variant="secondary" onClick={() => dialog.current?.close()}>
              Keep chat
            </Button>
            <Button
              variant="danger"
              onClick={() => {
                dialog.current?.close();
                onDelete();
              }}
            >
              Delete chat
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
}
