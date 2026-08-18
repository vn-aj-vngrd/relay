"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";

type Option = { value: string; label: string };

export function SelectField({
  id,
  name = id,
  label,
  options,
  defaultValue = "",
  value: controlledValue,
  onValueChange,
  hideLabel = false,
  className = "",
}: {
  id: string;
  name?: string;
  label: string;
  options: readonly Option[];
  defaultValue?: string;
  value?: string;
  onValueChange?: (value: string) => void;
  hideLabel?: boolean;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const value = controlledValue ?? localValue;
  const setValue = (next: string) => {
    if (controlledValue === undefined) setLocalValue(next);
    onValueChange?.(next);
  };
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const selected = options.find((option) => option.value === value) ?? options[0];
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const key = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", pointer);
    document.addEventListener("keydown", key);
    return () => {
      document.removeEventListener("pointerdown", pointer);
      document.removeEventListener("keydown", key);
    };
  }, [open]);

  return (
    <div ref={root} className="relative min-w-0">
      <label htmlFor={id} className={hideLabel ? "sr-only" : "block text-sm font-[650]"}>
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => setOpen((current) => !current)}
        className={`mt-1.5 flex h-11 w-full items-center justify-between gap-3 rounded-lg border border-line bg-surface px-3 text-left text-sm text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 ${className}`}
      >
        <span className="truncate">{selected?.label}</span>
        <CaretDown
          aria-hidden
          size={14}
          className={`shrink-0 text-muted transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open ? (
        <div
          role="listbox"
          aria-label={`${label} options`}
          className="fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 max-h-[55svh] w-auto overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(13_15_20/.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+.5rem)] sm:max-h-64 sm:w-full sm:min-w-44"
        >
          {options.map((option) => (
            <button
              key={option.value}
              type="button"
              role="option"
              aria-selected={value === option.value}
              onClick={() => {
                setValue(option.value);
                setOpen(false);
              }}
              className={`pressable flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm ${value === option.value ? "bg-primary-soft font-semibold text-primary" : "hover:bg-surface-strong"}`}
            >
              <span>{option.label}</span>
              {value === option.value ? <Check aria-hidden size={14} className="shrink-0" /> : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
