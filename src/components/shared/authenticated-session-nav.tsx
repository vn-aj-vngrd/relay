"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { usePopoverTransition } from "@/components/ui/use-popover-transition";

import { SessionNav } from "./session-nav";
import { SESSION_TABS, type SessionTabLabel } from "./session-tabs";

export function activeTab(pathname: string): SessionTabLabel | null {
  if (pathname.endsWith("/players")) return "Players";
  if (/\/games\/[^/]+\/play(?:\/|$)/.test(pathname)) return "Play";
  if (pathname.endsWith("/chat")) return "Chat";
  if (pathname.endsWith("/payments")) return "Payments";
  if (pathname.endsWith("/story")) return "Story";
  if (/\/games\/[^/]+$/.test(pathname)) return "Overview";
  return null;
}

export function AuthenticatedSessionNav({ id }: { id: string }) {
  return <SessionNav id={id} active={activeTab(usePathname())} embedded />;
}

export function MobileAuthenticatedSessionNav({ id }: { id: string }) {
  const pathname = usePathname();
  const current = activeTab(pathname);
  const { open, rendered, hide, toggle } = usePopoverTransition();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) hide();
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      hide();
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [hide, open]);

  return (
    <div ref={root} className="relative min-w-0 flex-1">
      <button
        ref={trigger}
        type="button"
        aria-label={`Game section, currently ${current ?? "outside the main sections"}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={toggle}
        className="pressable flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 text-left text-sm font-[650] text-ink hover:bg-surface-strong"
      >
        <span className="truncate">{current ?? "Game sections"}</span>
        <CaretDown
          aria-hidden
          size={15}
          className={`shrink-0 text-muted transition-transform duration-150 motion-reduce:transition-none ${open ? "rotate-180" : ""}`}
        />
      </button>
      {rendered ? (
        <div
          role="menu"
          aria-label="Game sections"
          data-state={open ? "open" : "closed"}
          data-align="stretch"
          className="menu-popover absolute left-0 top-[calc(100%+6px)] z-30 w-full min-w-48 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
        >
          {SESSION_TABS.map((tab) => {
            const selected = tab.label === current;
            return (
              <Link
                key={tab.label}
                href={`/games/${id}${tab.path}`}
                role="menuitem"
                aria-current={selected ? "page" : undefined}
                onClick={hide}
                className={`pressable flex min-h-11 items-center justify-between gap-3 rounded-md px-3 text-sm font-[600] ${selected ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface-strong"}`}
              >
                {tab.label}
                {selected ? <Check aria-hidden size={16} weight="bold" /> : null}
              </Link>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
