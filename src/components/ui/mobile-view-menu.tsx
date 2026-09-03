"use client";

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
}: {
  label: string;
  value: T;
  options: readonly ViewOption<T>[];
  onChange: (value: T) => void;
  responsiveClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const current = options.find((option) => option.value === value) ?? options[0]!;
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
        className="compact-control mobile-view-menu-trigger pressable grid h-9 w-9 place-items-center rounded-lg border border-transparent bg-transparent text-muted hover:bg-surface-strong hover:text-ink"
      >
        <span aria-hidden>
          <CurrentIcon size={18} />
        </span>
      </button>
      {open ? (
        <div
          role="menu"
          aria-label={label}
          className="absolute right-0 top-[calc(100%+6px)] z-30 min-w-40 rounded-lg border border-line bg-surface p-1 shadow-[0_4px_8px_oklch(0.1_0.01_275/.12)]"
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
                className={`pressable flex min-h-10 w-full items-center gap-2 rounded-md px-3 text-left text-sm font-[600] ${value === option.value ? "bg-primary-soft text-primary" : "text-ink hover:bg-surface-strong"}`}
              >
                <span aria-hidden>
                  <Icon size={17} />
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}
