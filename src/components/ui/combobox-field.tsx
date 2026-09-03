"use client";

import { CaretDown, Check } from "@phosphor-icons/react";
import {
  type KeyboardEvent,
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

type ComboboxOption = { value: string; label: string; description?: string };

function searchableText(option: ComboboxOption) {
  return `${option.label} ${option.description ?? ""}`
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
}

export function ComboboxField({
  id,
  name = id,
  label,
  options,
  value = "",
  onValueChange,
  placeholder = "Search or choose…",
  emptyMessage = "No matching options.",
  required = false,
  className = "",
}: {
  id: string;
  name?: string;
  label: string;
  options: readonly ComboboxOption[];
  value?: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  required?: boolean;
  className?: string;
}) {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const listboxId = `${useId().replaceAll(":", "")}-options`;
  const selected = options.find((option) => option.value === value);
  const [query, setQuery] = useState(selected?.label ?? "");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const normalizedQuery = query
    .trim()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase();
  const matches = useMemo(
    () =>
      options.filter(
        (option) =>
          !normalizedQuery || searchableText(option).includes(normalizedQuery)
      ),
    [normalizedQuery, options]
  );

  useEffect(() => {
    if (!open) return;
    const handlePointerDown = (event: PointerEvent) => {
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function choose(option: ComboboxOption) {
    setQuery(option.label);
    setOpen(false);
    setActiveIndex(-1);
    onValueChange(option.value);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
      setQuery(selected?.label ?? "");
      return;
    }
    if (
      event.key === "ArrowDown" ||
      event.key === "ArrowUp" ||
      event.key === "Home" ||
      event.key === "End"
    ) {
      event.preventDefault();
      setOpen(true);
      if (!matches.length) return;
      setActiveIndex((current) => {
        if (event.key === "Home") return 0;
        if (event.key === "End") return matches.length - 1;
        if (event.key === "ArrowDown")
          return current < matches.length - 1 ? current + 1 : 0;
        return current > 0 ? current - 1 : matches.length - 1;
      });
      return;
    }
    if (
      event.key === "Enter" &&
      open &&
      activeIndex >= 0 &&
      matches[activeIndex]
    ) {
      event.preventDefault();
      choose(matches[activeIndex]);
    }
  }

  return (
    <div ref={rootRef} className={`relative min-w-0 ${className}`}>
      <label htmlFor={id} className="block text-sm font-[650]">
        {label}
      </label>
      <input type="hidden" name={name} value={value} />
      <div className="relative mt-1.5">
        <input
          ref={inputRef}
          id={id}
          type="text"
          role="combobox"
          aria-autocomplete="list"
          aria-expanded={open}
          aria-controls={listboxId}
          aria-activedescendant={
            open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined
          }
          autoComplete="off"
          required={required}
          value={query}
          placeholder={placeholder}
          onFocus={() => {
            setOpen(true);
            setActiveIndex(
              matches.findIndex((option) => option.value === value)
            );
          }}
          onBlur={(event) => {
            if (!rootRef.current?.contains(event.relatedTarget)) setOpen(false);
          }}
          onChange={(event) => {
            setQuery(event.target.value);
            setOpen(true);
            setActiveIndex(0);
            if (value) onValueChange("");
          }}
          onKeyDown={handleKeyDown}
          className="h-11 w-full rounded-lg border border-line bg-surface px-3 pr-10 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
        <CaretDown
          aria-hidden
          className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted"
          size={14}
        />
      </div>
      {open ? (
        <div
          id={listboxId}
          role="listbox"
          aria-label={`${label} options`}
          className="menu-popover absolute inset-x-0 top-[calc(100%+.5rem)] z-40 max-h-72 overflow-y-auto rounded-xl border border-line bg-surface p-1 shadow-[0_8px_24px_rgb(13_15_20/.14)]"
        >
          {matches.length ? (
            matches.map((option, index) => (
              <button
                key={option.value}
                id={`${listboxId}-${index}`}
                type="button"
                role="option"
                tabIndex={-1}
                aria-selected={option.value === value}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => choose(option)}
                className={`pressable flex min-h-11 w-full items-center justify-between gap-3 rounded-lg px-3 py-2 text-left ${activeIndex === index ? "bg-surface-strong" : "hover:bg-surface-strong/70"}`}
              >
                <span className="min-w-0">
                  <span className="block truncate text-sm font-semibold text-ink">
                    {option.label}
                  </span>
                  {option.description ? (
                    <span className="mt-0.5 block truncate text-xs text-muted">
                      {option.description}
                    </span>
                  ) : null}
                </span>
                {option.value === value ? (
                  <Check
                    aria-hidden
                    className="shrink-0 text-primary"
                    size={15}
                  />
                ) : null}
              </button>
            ))
          ) : (
            <p className="px-3 py-4 text-sm text-muted">{emptyMessage}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}
