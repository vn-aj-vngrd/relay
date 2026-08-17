"use client";

import { MapPin } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { VenueSuggestion } from "./geoapify";

type SearchState = "idle" | "loading" | "ready" | "empty" | "error";

export function VenueCombobox({ defaultValue = "", defaultAddress = "", error }: { defaultValue?: string; defaultAddress?: string; error?: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const userEditedRef = useRef(false);
  const [query, setQuery] = useState(defaultValue);
  const [address, setAddress] = useState(defaultAddress);
  const [suggestions, setSuggestions] = useState<VenueSuggestion[]>([]);
  const [searchState, setSearchState] = useState<SearchState>("idle");
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);
  const listboxId = "venue-suggestions";

  useEffect(() => {
    const term = query.trim();
    if (!userEditedRef.current || term.length < 3 || address) return;

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setSearchState("loading");
      try {
        const response = await fetch(`/api/venues/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        if (!response.ok) throw new Error("Venue search failed");
        const data = await response.json() as { suggestions?: VenueSuggestion[] };
        const next = data.suggestions ?? [];
        setSuggestions(next);
        setSearchState(next.length ? "ready" : "empty");
        setOpen(true);
        setActiveIndex(next.length ? 0 : -1);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setSuggestions([]);
        setSearchState("error");
        setOpen(false);
      }
    }, 300);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [address, query]);

  function selectSuggestion(suggestion: VenueSuggestion) {
    setQuery(suggestion.name);
    setAddress(suggestion.address);
    setSuggestions([]);
    setSearchState("idle");
    setOpen(false);
    setActiveIndex(-1);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLInputElement>) {
    if (!open || suggestions.length === 0) {
      if (event.key === "ArrowDown" && suggestions.length) setOpen(true);
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
    : searchState === "loading" ? "Searching Philippine places…"
      : searchState === "error" ? "Venue search is unavailable. You can still enter a venue."
        : searchState === "empty" ? "No matching place found. You can still use what you typed."
          : "Search Philippine venues and addresses.";

  return <div ref={containerRef} className="relative" onBlurCapture={(event) => {
    if (!containerRef.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
  }}>
    <MapPin className="pointer-events-none absolute left-3.5 top-[17px] z-10 text-muted" size={18} />
    <input
      className={`mt-1.5 h-11 w-full rounded-lg border bg-surface px-3 pl-10 text-[15px] text-ink placeholder:text-muted focus:outline-none ${error ? "border-danger focus:border-danger focus:ring-2 focus:ring-danger/15" : "border-line focus:border-primary focus:ring-2 focus:ring-primary/15"}`}
      id="venue"
      name="venue"
      required
      maxLength={120}
      autoComplete="off"
      placeholder="Search or enter a venue…"
      value={query}
      onChange={(event) => {
        userEditedRef.current = true;
        setQuery(event.target.value);
        setAddress("");
        setSuggestions([]);
        setSearchState("idle");
        setOpen(false);
        setActiveIndex(-1);
      }}
      onFocus={() => setOpen(suggestions.length > 0)}
      onKeyDown={handleKeyDown}
      role="combobox"
      aria-autocomplete="list"
      aria-expanded={open}
      aria-controls={listboxId}
      aria-activedescendant={open && activeIndex >= 0 ? `${listboxId}-${activeIndex}` : undefined}
      aria-invalid={Boolean(error)}
      aria-describedby={`venue-hint${error ? " venue-error" : ""}`}
    />
    <input type="hidden" name="venueAddress" value={address} />
    {open && suggestions.length ? <ul id={listboxId} role="listbox" aria-label="Venue suggestions" className="absolute inset-x-0 top-[52px] z-40 max-h-72 overflow-y-auto rounded-lg border border-line bg-surface p-1 shadow-[0_6px_8px_oklch(0.1_0.01_275/.12)]">
      {suggestions.map((suggestion, index) => <li key={suggestion.id} id={`${listboxId}-${index}`} role="option" aria-selected={activeIndex === index} onMouseDown={(event) => event.preventDefault()} onMouseEnter={() => setActiveIndex(index)} onClick={() => selectSuggestion(suggestion)} className={`pressable flex min-h-14 w-full cursor-pointer items-start gap-3 rounded-md px-3 py-2.5 text-left ${activeIndex === index ? "bg-surface-strong" : "hover:bg-surface-strong/70"}`}>
        <MapPin aria-hidden className="mt-0.5 shrink-0 text-primary" size={17} />
        <span className="min-w-0"><strong className="block truncate text-sm font-semibold text-ink">{suggestion.name}</strong><span className="mt-0.5 block truncate text-xs text-muted">{suggestion.address}</span></span>
      </li>)}
    </ul> : null}
    <div className="mt-1.5 flex flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm">
      <p id="venue-hint" aria-live="polite" className={searchState === "error" ? "text-danger" : "text-muted"}>{hint}</p>
      <a href="https://www.geoapify.com/" target="_blank" rel="noreferrer" className="text-xs text-muted underline decoration-line underline-offset-2 hover:text-ink">Places by Geoapify</a>
    </div>
  </div>;
}
