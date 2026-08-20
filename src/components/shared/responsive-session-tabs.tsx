"use client";

import { CaretDown } from "@phosphor-icons/react";
import Link from "next/link";
import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";

import { SESSION_TABS, type SessionTabLabel } from "./session-tabs";

const LINK_CLASS = "relative flex min-h-11 items-center px-3 text-[13px] font-medium";
const MORE_CLASS = "relative flex min-h-11 items-center gap-1 px-3 text-[13px] font-medium";
const MOBILE_LIST_PADDING = 8;

export function visibleSessionTabCount(
  availableWidth: number,
  tabWidths: number[],
  moreWidth: number,
  horizontalPadding = 0,
) {
  const contentWidth = Math.max(0, availableWidth - horizontalPadding);
  if (tabWidths.reduce((total, width) => total + width, 0) <= contentWidth) return tabWidths.length;

  const tabsWidth = Math.max(0, contentWidth - moreWidth);
  let used = 0;
  let visible = 0;
  for (const width of tabWidths) {
    if (used + width > tabsWidth) break;
    used += width;
    visible += 1;
  }
  return Math.max(1, Math.min(visible, tabWidths.length - 1));
}

export function ResponsiveSessionTabs({
  hrefBase,
  active,
  mobilePadding = false,
  linkClassName = "",
}: {
  hrefBase: string;
  active: SessionTabLabel | null;
  mobilePadding?: boolean;
  linkClassName?: string;
}) {
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);
  const tabLinks = useRef<Array<HTMLAnchorElement | null>>([]);
  const tabWidths = useRef<number[]>([]);
  const moreMeasure = useRef<HTMLSpanElement>(null);
  const [visibleCount, setVisibleCount] = useState<number>(SESSION_TABS.length);
  const [open, setOpen] = useState(false);

  const measure = useCallback(() => {
    const width = root.current?.clientWidth ?? 0;
    tabLinks.current.forEach((item, index) => {
      const measuredWidth = item?.getBoundingClientRect().width ?? 0;
      if (measuredWidth) tabWidths.current[index] = measuredWidth;
    });
    const moreWidth = moreMeasure.current?.getBoundingClientRect().width ?? 0;
    if (!width || !moreWidth || tabWidths.current.length !== SESSION_TABS.length) return;
    setVisibleCount(
      visibleSessionTabCount(
        width,
        tabWidths.current,
        moreWidth,
        mobilePadding && width < 640 ? MOBILE_LIST_PADDING : 0,
      ),
    );
  }, [mobilePadding]);

  useLayoutEffect(() => {
    measure();
    if (typeof ResizeObserver === "undefined" || !root.current) return;
    let cancelled = false;
    const observer = new ResizeObserver(measure);
    observer.observe(root.current);
    void document.fonts?.ready.then(() => {
      if (!cancelled) measure();
    });
    return () => {
      cancelled = true;
      observer.disconnect();
    };
  }, [measure]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      setOpen(false);
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    const frame = requestAnimationFrame(() =>
      menu.current?.querySelector<HTMLAnchorElement>('a[role="menuitem"]')?.focus(),
    );
    return () => {
      cancelAnimationFrame(frame);
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  const visibleTabs = SESSION_TABS.slice(0, visibleCount);
  const overflowTabs = SESSION_TABS.slice(visibleCount);
  const hiddenActive = overflowTabs.some((tab) => tab.label === active);

  const handleMenuKeys = (event: React.KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const items = [...event.currentTarget.querySelectorAll<HTMLAnchorElement>('a[role="menuitem"]')];
    const current = items.indexOf(document.activeElement as HTMLAnchorElement);
    const direction = event.key === "ArrowDown" ? 1 : -1;
    items[(current + direction + items.length) % items.length]?.focus();
  };

  return (
    <div ref={root} className="relative min-w-0">
      <span aria-hidden className="pointer-events-none absolute invisible w-max">
        <span ref={moreMeasure} className={MORE_CLASS}>
          More <CaretDown aria-hidden size={13} />
        </span>
      </span>

      <ul className={`flex w-full ${mobilePadding ? "px-1 sm:px-0" : ""}`}>
        {visibleTabs.map((tab, index) => {
          const selected = active === tab.label;
          return (
            <li key={tab.label}>
              <Link
                ref={(node) => {
                  tabLinks.current[index] = node;
                }}
                href={`${hrefBase}${tab.path}`}
                aria-current={selected ? "page" : undefined}
                className={`${LINK_CLASS} ${linkClassName} ${selected ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}
              >
                {tab.label}
              </Link>
            </li>
          );
        })}
        {overflowTabs.length ? (
          <li className="relative">
            <button
              ref={trigger}
              type="button"
              aria-haspopup="menu"
              aria-expanded={open}
              onClick={() => setOpen((value) => !value)}
              onKeyDown={(event) => {
                if (event.key !== "ArrowDown") return;
                event.preventDefault();
                setOpen(true);
              }}
              className={`${MORE_CLASS} ${hiddenActive ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}
            >
              More <CaretDown aria-hidden size={13} />
            </button>
            {open ? (
              <div
                ref={menu}
                role="menu"
                aria-label="More game pages"
                onKeyDown={handleMenuKeys}
                className="absolute right-0 top-[calc(100%-2px)] z-40 min-w-44 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
              >
                {overflowTabs.map((tab) => {
                  const selected = active === tab.label;
                  return (
                    <Link
                      key={tab.label}
                      role="menuitem"
                      href={`${hrefBase}${tab.path}`}
                      aria-current={selected ? "page" : undefined}
                      onClick={() => setOpen(false)}
                      className={`flex min-h-10 items-center rounded-md px-3 text-sm font-medium hover:bg-surface-strong ${selected ? "text-primary" : "text-ink"}`}
                    >
                      {tab.label}
                    </Link>
                  );
                })}
              </div>
            ) : null}
          </li>
        ) : null}
      </ul>
    </div>
  );
}
