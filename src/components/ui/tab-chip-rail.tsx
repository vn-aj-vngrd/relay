"use client";

import Link from "next/link";
import { useCallback, useLayoutEffect, useRef, useState } from "react";

type TabChipItem<T extends string> = {
  value: T;
  label: string;
  count?: number;
};

export function TabChipRail<T extends string>({
  label,
  items,
  value,
  onChange,
  hrefFor,
  className = "",
  itemClassName = "",
  variant = "chip",
}: {
  label: string;
  items: readonly TabChipItem<T>[];
  value: T | null;
  onChange?: (value: T) => void;
  hrefFor?: (item: TabChipItem<T>) => string;
  className?: string;
  itemClassName?: string;
  variant?: "chip" | "underline";
}) {
  const scroller = useRef<HTMLDivElement>(null);
  const activeItem = useRef<HTMLElement | null>(null);
  const [fade, setFade] = useState<"none" | "left" | "right" | "both">("none");

  const updateFade = useCallback(() => {
    const rail = scroller.current;
    if (!rail) return;
    const maxScroll = Math.max(0, rail.scrollWidth - rail.clientWidth);
    const hasLeft = rail.scrollLeft > 1;
    const hasRight = rail.scrollLeft < maxScroll - 1;
    setFade(hasLeft && hasRight ? "both" : hasLeft ? "left" : hasRight ? "right" : "none");
  }, []);

  useLayoutEffect(() => {
    const rail = scroller.current;
    const item = activeItem.current;
    if (!rail) return;
    if (item) {
      const left = item.offsetLeft - (rail.clientWidth - item.clientWidth) / 2;
      rail.scrollTo?.({ left: Math.max(0, left), behavior: "auto" });
    }
    updateFade();
    const observer = typeof ResizeObserver === "undefined" ? null : new ResizeObserver(updateFade);
    observer?.observe(rail);
    window.addEventListener("resize", updateFade);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", updateFade);
    };
  }, [items.length, updateFade, value]);

  const fadeClass = fade === "none" ? "" : `tab-chip-fade-${fade}`;

  return (
    <div
      ref={scroller}
      onScroll={updateFade}
      className={`public-session-scroll -mx-1.5 overflow-x-auto px-1.5 ${variant === "underline" ? "" : "-my-1.5 py-1.5"} ${fadeClass} ${className}`}
    >
      <div role="group" aria-label={label} className={`flex min-w-max ${variant === "underline" ? "" : "gap-2"}`}>
        {items.map((item) => {
          const selected = item.value === value;
          const ariaLabel = item.count === undefined ? item.label : `${item.label}, ${item.count}`;
          const classes =
            variant === "underline"
              ? `compact-control tab-chip pressable relative inline-flex min-h-11 items-center px-3 text-sm font-semibold ${itemClassName} ${
                  selected
                    ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary"
                    : "text-muted hover:text-ink"
                }`
              : `compact-control tab-chip pressable inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-[650] ${itemClassName} ${
                  selected
                    ? "border-primary/20 bg-primary-soft text-primary-hover"
                    : "border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink"
                }`;
          const setActiveItem = (node: HTMLElement | null) => {
            if (selected) activeItem.current = node;
          };

          return hrefFor ? (
            <Link
              ref={setActiveItem}
              key={item.value}
              href={hrefFor(item)}
              aria-current={selected ? "page" : undefined}
              aria-label={ariaLabel}
              className={classes}
            >
              {item.label}
            </Link>
          ) : (
            <button
              ref={setActiveItem}
              key={item.value}
              type="button"
              aria-pressed={selected}
              aria-label={ariaLabel}
              onClick={() => onChange?.(item.value)}
              className={classes}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
