"use client";

import { CalendarBlank, Compass, Plus } from "@phosphor-icons/react";
import type { Editor } from "@tiptap/react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { EmptyState } from "@/components/shared/content-state";
import { type AgentCapabilities, availableAgentPrompts } from "./capabilities";
import type { CreationFlow } from "./creation-model";

export function slashQuery(beforeCursor: string) {
  return /(?:^|\s)\/([\p{L}\p{N} -]*)$/u.exec(beforeCursor)?.[1] ?? null;
}
export function matchingSlashCommands(
  capabilities: AgentCapabilities,
  query: string
) {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean);
  return availableAgentPrompts(capabilities).filter((item) =>
    words.every((word) =>
      `${item.label} ${item.prompt}`.toLowerCase().includes(word)
    )
  );
}
type SlashRange = { from: number; to: number; query: string; manual?: boolean };
const signature = (value: SlashRange) =>
  `${value.from}:${value.to}:${value.query}`;
export function useAgentSlashCommands(
  editor: Editor | null,
  capabilities: AgentCapabilities | undefined,
  disabled: boolean,
  onCreate?: (flow: CreationFlow) => void
) {
  const id = useId();
  const [range, setRange] = useState<SlashRange | null>(null);
  const [highlight, setHighlight] = useState(0);
  const dismissed = useRef<string | null>(null);
  const manuallyOpened = useRef(false);
  const list = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!editor || !capabilities || disabled) {
      setRange(null);
      return;
    }
    const sync = () => {
      manuallyOpened.current = false;
      const { selection } = editor.state;
      const { $from } = selection;
      if (
        !editor.isFocused ||
        !selection.empty ||
        $from.parent.type.name !== "paragraph" ||
        $from.marks().some((mark) => mark.type.name === "code")
      ) {
        setRange(null);
        return;
      }
      const query = slashQuery(
        $from.parent.textBetween(0, $from.parentOffset, "\n", "\ufffc")
      );
      if (query === null) {
        dismissed.current = null;
        setRange(null);
        return;
      }
      const next = {
        from: selection.from - query.length - 1,
        to: selection.from,
        query,
      };
      if (dismissed.current === signature(next)) return;
      setRange((previous) =>
        previous && signature(previous) === signature(next) ? previous : next
      );
    };
    const focus = () => {
      if (!manuallyOpened.current) sync();
    };
    const blur = () => {
      manuallyOpened.current = false;
      setRange(null);
    };
    editor
      .on("update", sync)
      .on("selectionUpdate", sync)
      .on("focus", focus)
      .on("blur", blur);
    sync();
    return () => {
      editor
        .off("update", sync)
        .off("selectionUpdate", sync)
        .off("focus", focus)
        .off("blur", blur);
    };
  }, [editor, capabilities, disabled]);
  const items =
    range && capabilities
      ? matchingSlashCommands(capabilities, range.query)
      : [];
  const active = Math.min(highlight, Math.max(0, items.length - 1));
  useEffect(() => {
    setHighlight(0);
  }, [range?.query, range?.from]);
  useEffect(() => {
    list.current
      ?.querySelector('[aria-selected="true"]')
      ?.scrollIntoView?.({ block: "nearest" });
  }, [active, range?.query]);
  useEffect(() => {
    if (!editor) return;
    const element = editor.view.dom;
    if (range && !disabled) {
      element.setAttribute("aria-autocomplete", "list");
      element.setAttribute("aria-controls", id);
      if (items.length)
        element.setAttribute("aria-activedescendant", `${id}-${active}`);
      else element.removeAttribute("aria-activedescendant");
    } else {
      element.removeAttribute("aria-controls");
      element.removeAttribute("aria-activedescendant");
      element.removeAttribute("aria-autocomplete");
    }
    return () => {
      element.removeAttribute("aria-controls");
      element.removeAttribute("aria-activedescendant");
      element.removeAttribute("aria-autocomplete");
    };
  }, [editor, range, disabled, id, active, items.length]);
  function open() {
    if (!editor || disabled || !capabilities) return;
    dismissed.current = null;
    editor.commands.focus();
    manuallyOpened.current = true;
    const { from, to } = editor.state.selection;
    setHighlight(0);
    setRange({ from, to, query: "", manual: true });
  }
  function choose(index: number) {
    const item = items[index];
    if (!editor || !range || disabled || !item) return;
    if ("flow" in item && onCreate) {
      setRange(null);
      if (!range.manual)
        editor
          .chain()
          .focus()
          .deleteRange({ from: range.from, to: range.to })
          .run();
      onCreate(item.flow);
      return;
    }
    const before = editor.state.doc.textBetween(
      Math.max(0, range.from - 1),
      range.from
    );
    const after = editor.state.doc.textBetween(
      range.to,
      Math.min(editor.state.doc.content.size, range.to + 1)
    );
    const text = range.manual
      ? `${before && !/\s/.test(before) ? " " : ""}${item.prompt}${after && !/\s/.test(after) ? " " : ""}`
      : item.prompt;
    setRange(null);
    editor
      .chain()
      .focus()
      .insertContentAt(
        { from: range.from, to: range.to },
        { type: "text", text }
      )
      .run();
  }
  function keyDown(event: KeyboardEvent) {
    if (
      !range ||
      disabled ||
      event.isComposing ||
      editor?.view.composing ||
      event.ctrlKey ||
      event.metaKey ||
      event.altKey ||
      event.shiftKey
    )
      return false;
    if (event.key === "Escape") {
      dismissed.current = signature(range);
      setRange(null);
      event.preventDefault();
      return true;
    }
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      if (items.length)
        setHighlight(
          (active + (event.key === "ArrowDown" ? 1 : items.length - 1)) %
            items.length
        );
      return true;
    }
    if (event.key === "Enter") {
      event.preventDefault();
      if (items.length) choose(active);
      return true;
    }
    if (event.key === "Tab") {
      dismissed.current = signature(range);
      setRange(null);
    }
    return false;
  }
  const popup =
    range && !disabled ? (
      <div
        className={
          "absolute -inset-x-[13px] bottom-full z-40 mb-6 overflow-hidden rounded-xl border border-line bg-surface shadow-lg"
        }
      >
        <div
          ref={list}
          id={id}
          role="listbox"
          aria-label="Available Agent actions"
          className="max-h-[min(20rem,40dvh)] space-y-1 overflow-y-auto overscroll-contain p-1.5"
        >
          {(["Create", "Explore"] as const).map((category) => {
            const rows = items
              .map((item, index) => ({ item, index }))
              .filter(({ item }) => item.category === category);
            if (!rows.length) return null;
            return (
              <div
                key={category}
                role="group"
                aria-labelledby={`${id}-${category}`}
                className="space-y-1"
              >
                <div
                  id={`${id}-${category}`}
                  className="px-3 pb-1 pt-3 text-xs font-medium text-muted"
                >
                  {category}
                </div>
                {rows.map(({ item, index }) => {
                  const Icon =
                    item.category === "Create"
                      ? Plus
                      : item.capability === "allowGameData"
                        ? CalendarBlank
                        : Compass;
                  return (
                    <button
                      key={item.label}
                      id={`${id}-${index}`}
                      type="button"
                      role="option"
                      aria-selected={active === index}
                      tabIndex={-1}
                      onPointerDown={(event) => event.preventDefault()}
                      onMouseMove={() => setHighlight(index)}
                      onClick={() => choose(index)}
                      className={`flex min-h-11 w-full items-center gap-2.5 rounded-lg px-3 py-2 text-left ${active === index ? "bg-surface-strong text-ink" : "text-muted"}`}
                    >
                      <Icon size={17} className="shrink-0" aria-hidden />
                      <span className="shrink-0 whitespace-nowrap text-sm font-medium text-ink">
                        {item.label}
                      </span>
                      <span className="min-w-0 truncate text-sm text-muted">
                        {item.prompt}
                      </span>
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>
        {!items.length ? (
          <EmptyState
            compact
            icon="search"
            title="No available actions match"
            description="Try another word or press Escape."
          />
        ) : null}
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-line px-4 py-2 text-xs text-muted">
          <p role="status">
            {items.length} {items.length === 1 ? "action" : "actions"} · ↑↓ to
            browse · Enter to insert · Esc to close
          </p>
          <Link
            href="/help/agent-capabilities"
            onPointerDown={(event) => event.preventDefault()}
            className="hover:text-ink"
          >
            All capabilities &amp; help
          </Link>
        </div>
      </div>
    ) : null;
  return { popup, keyDown, open, isOpen: Boolean(range && !disabled) };
}
