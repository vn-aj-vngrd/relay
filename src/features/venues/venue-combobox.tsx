"use client";

import { MapPin } from "@phosphor-icons/react";
import type { KeyboardEvent } from "react";
import { useMemo, useRef, useState } from "react";

export type CourtSuggestion = { id: string; name: string; address: string };

export function VenueCombobox({
  courts = [],
  defaultValue = "",
  defaultAddress = "",
  defaultVenueId = "",
  error,
  onValueChange,
}: {
  courts?: CourtSuggestion[];
  defaultValue?: string;
  defaultAddress?: string;
  defaultVenueId?: string;
  error?: string;
  onValueChange?: () => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState(defaultValue);
  const [address, setAddress] = useState(defaultAddress);
  const [venueId, setVenueId] = useState(defaultVenueId);
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = "venue-suggestions";
  const suggestions = useMemo(() => {
    if (address) return [];
    const term = query.trim().toLocaleLowerCase();
    return courts
      .filter(
        (court) =>
          !term || court.name.toLocaleLowerCase().includes(term) || court.address.toLocaleLowerCase().includes(term),
      )
      .slice(0, 6);
  }, [address, courts, query]);

  function selectSuggestion(suggestion: CourtSuggestion) {
    setQuery(suggestion.name);
    setAddress(suggestion.address);
    setVenueId(suggestion.id);
    setOpen(false);
    setActiveIndex(-1);
    onValueChange?.();
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length) {
        event.preventDefault();
        setOpen(true);
        setActiveIndex(0);
      }
      return;
    }
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % suggestions.length);
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? suggestions.length - 1 : index - 1));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectSuggestion(suggestions[activeIndex]);
    } else if (event.key === "Escape") {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  const hint = address
    ? address
    : query.trim() && suggestions.length === 0
      ? "No matching Relay court. You can still use what you typed."
      : "Choose a Relay court or enter another court name.";

  return (
    <div
      ref={containerRef}
      className="relative"
      onBlurCapture={(event) => {
        if (!containerRef.current?.contains(event.relatedTarget as Node | null)) {
          setOpen(false);
          setActiveIndex(-1);
        }
      }}
    >
      <MapPin className="pointer-events-none absolute left-3.5 top-[17px] z-10 text-muted" size={18} />
      <input
        className={`mt-1.5 h-11 w-full rounded-lg border bg-surface px-3 pl-10 text-[15px] text-ink placeholder:text-muted focus:outline-none ${error ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/15" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"}`}
        id="venue"
        name="venue"
        required
        maxLength={120}
        autoComplete="off"
        placeholder="Search or enter a court…"
        value={query}
        onChange={(event) => {
          setQuery(event.target.value);
          setAddress("");
          setVenueId("");
          setOpen(true);
          setActiveIndex(0);
          onValueChange?.();
        }}
        onFocus={() => {
          setOpen(true);
          setActiveIndex(suggestions.length ? 0 : -1);
        }}
        onKeyDown={handleKeyDown}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={open && suggestions.length > 0}
        aria-controls={listboxId}
        aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
        aria-invalid={Boolean(error)}
        aria-describedby={`venue-hint${error ? " venue-error" : ""}`}
      />
      <input type="hidden" name="venueId" value={venueId} />
      <input type="hidden" name="venueAddress" value={address} />
      {open && suggestions.length ? (
        <ul
          id={listboxId}
          role="listbox"
          aria-label="Court suggestions"
          className="absolute inset-x-0 top-[52px] z-40 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-[0_6px_8px_oklch(0.1_0.01_275/.12)]"
        >
          {suggestions.map((suggestion, index) => (
            <li
              key={suggestion.id}
              id={`${listboxId}-${index}`}
              role="option"
              aria-selected={activeIndex === index}
              onMouseDown={(event) => event.preventDefault()}
              onMouseEnter={() => setActiveIndex(index)}
              onClick={() => selectSuggestion(suggestion)}
              className={`pressable flex min-h-14 w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-left ${activeIndex === index ? "bg-surface-strong" : "hover:bg-surface-strong/70"}`}
            >
              <MapPin aria-hidden className="mt-0.5 shrink-0 text-primary" size={17} />
              <span className="min-w-0">
                <strong className="block truncate text-sm font-semibold text-ink">{suggestion.name}</strong>
                <span className="mt-0.5 block truncate text-xs text-muted">{suggestion.address}</span>
              </span>
            </li>
          ))}
        </ul>
      ) : null}
      <p id="venue-hint" aria-live="polite" className="mt-1.5 text-sm text-muted">
        {hint}
      </p>
    </div>
  );
}
