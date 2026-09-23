"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import { type ComponentType, useEffect, useRef, useState } from "react";

type ViewOption<T extends string> = {
  value: T;
  label: string;
  icon: ComponentType<{ size?: number }>;
};

export function MobileViewMenu<T extends string>({
  label,
  value,
  options,
  onChange,
  responsiveClassName = "sm:hidden",
  showLabel = false,
}: {
  label: string;
  value: T;
  options: readonly ViewOption<T>[];
  onChange: (value: T) => void;
  responsiveClassName?: string;
  showLabel?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current =
    options.find((option) => option.value === value) ?? options[0]!;
  const CurrentIcon = current.icon;

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
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [open]);

  return (
    <div ref={root} className={`relative shrink-0 ${responsiveClassName}`}>
      <button
        ref={trigger}
        type="button"
        aria-label={`Change ${label.toLowerCase()}, currently ${current.label}`}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((currentOpen) => !currentOpen)}
        className={`compact-control mobile-view-menu-trigger pressable inline-flex h-9 items-center justify-center gap-2 border border-transparent bg-transparent hover:bg-surface-strong hover:text-ink ${showLabel ? "rounded-full px-3 text-xs font-semibold text-ink sm:text-[13px]" : "w-9 rounded-lg text-muted"}`}
      >
        <span aria-hidden className="shrink-0 text-muted">
          <CurrentIcon size={showLabel ? 14 : 18} />
        </span>
        {showLabel ? (
          <>
            <span>{current.label}</span>
            <CaretDown aria-hidden size={14} className="shrink-0 text-muted" />
          </>
        ) : null}
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+8px)] z-30 min-w-44 rounded-xl border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
        >
          {options.map((option) => {
            const Icon = option.icon;
            return (
              <button
                key={option.value}
                type="button"
                role="menuitemradio"
                aria-checked={value === option.value}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                  trigger.current?.focus();
                }}
                className={`compact-control pressable flex min-h-10 w-full items-center gap-2 rounded-lg px-3 text-left text-sm ${value === option.value ? "bg-primary-soft font-semibold text-primary" : "text-ink hover:bg-surface-strong"}`}
              >
                <span aria-hidden className="shrink-0 text-muted">
                  <Icon size={14} />
                </span>
                <span className="flex-1 whitespace-nowrap">{option.label}</span>
                {value === option.value ? (
                  <Check aria-hidden size={14} className="shrink-0" />
                ) : null}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
