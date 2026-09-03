"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import type { ReactNode } from "react";
import { useEffect, useRef, useState } from "react";

import { useButtonListbox } from "./use-button-listbox";
import { usePopoverTransition } from "./use-popover-transition";

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
  disabled = false,
  density = "default",
  leadingIcon,
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
  disabled?: boolean;
  density?: "default" | "compact";
  leadingIcon?: ReactNode;
  className?: string;
}) {
  const [localValue, setLocalValue] = useState(defaultValue);
  const root = useRef<HTMLDivElement>(null);
  const value = controlledValue ?? localValue;
  const setValue = (next: string) => {
    if (controlledValue === undefined) setLocalValue(next);
    onValueChange?.(next);
    root.current?.dispatchEvent(new Event("input", { bubbles: true }));
  };
  const {
    open,
    rendered,
    show: showPopover,
    hide: hidePopover,
  } = usePopoverTransition();
  const trigger = useRef<HTMLButtonElement>(null);
  const selected =
    options.find((option) => option.value === value) ?? options[0];
  const listbox = useButtonListbox({
    options,
    value,
    open,
    setOpen: (nextOpen) => {
      if (nextOpen) showPopover();
      else hidePopover();
    },
    onSelect: setValue,
    triggerRef: trigger,
  });
  useEffect(() => {
    if (!open) return;
    const pointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) listbox.close();
    };
    document.addEventListener("pointerdown", pointer);
    return () => document.removeEventListener("pointerdown", pointer);
  }, [listbox, open]);

  return (
    <div ref={root} className="relative min-w-0">
      <label
        htmlFor={id}
        className={hideLabel ? "sr-only" : "block text-sm font-[650]"}
      >
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <button
        ref={trigger}
        id={id}
        type="button"
        aria-haspopup="listbox"
        aria-expanded={open && !disabled}
        aria-controls={listbox.listboxId}
        aria-activedescendant={
          open && listbox.activeIndex >= 0
            ? listbox.optionId(listbox.activeIndex)
            : undefined
        }
        disabled={disabled}
        onClick={() => {
          if (open) listbox.close();
          else listbox.show();
        }}
        onKeyDown={listbox.handleKeyDown}
        className={`${hideLabel ? "mt-0" : "mt-1.5"} flex w-full items-center justify-between rounded-lg border border-line bg-surface text-left text-ink focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15 disabled:cursor-not-allowed disabled:bg-surface-strong disabled:text-muted ${density === "compact" ? "compact-control h-9 min-h-9 gap-2 px-3 text-[13px]" : "h-11 gap-3 px-3 text-sm"} ${className}`}
      >
        <span className="flex min-w-0 items-center gap-1.5">
          {leadingIcon ? (
            <span aria-hidden className="shrink-0 text-muted">
              {leadingIcon}
            </span>
          ) : null}
          <span className="truncate">{selected?.label}</span>
        </span>
        <CaretDown
          aria-hidden
          size={14}
          className={`shrink-0 text-muted transition-transform ${open && !disabled ? "rotate-180" : ""}`}
        />
      </button>
      {rendered && !disabled ? (
        <div
          id={listbox.listboxId}
          role="listbox"
          aria-label={`${label} options`}
          aria-hidden={!open}
          inert={!open}
          data-state={open ? "open" : "closed"}
          data-align="stretch"
          className="menu-popover fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 max-h-[55svh] w-auto overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(13_15_20/.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+.5rem)] sm:max-h-64 sm:w-full sm:min-w-44"
        >
          {options.map((option, index) => (
            <button
              id={listbox.optionId(index)}
              key={option.value}
              type="button"
              role="option"
              tabIndex={-1}
              aria-selected={value === option.value}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => listbox.setActiveIndex(index)}
              onClick={() => listbox.choose(index)}
              className={`pressable flex min-h-10 w-full items-center justify-between gap-3 rounded-lg px-3 text-left text-sm ${listbox.activeIndex === index ? "bg-surface-strong" : value === option.value ? "bg-primary-soft font-semibold text-primary" : "hover:bg-surface-strong"}`}
            >
              <span>{option.label}</span>
              {value === option.value ? (
                <Check aria-hidden size={14} className="shrink-0" />
              ) : null}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
