"use client";

import { ArrowSquareOut, Buildings, CheckCircle, Copy, MagnifyingGlass, MapPin, Plus, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { CebuCourtMap } from "./cebu-court-map";
import type { CebuVenue } from "./queries";

function createHref(venue: CebuVenue) {
  return `/games/new?${new URLSearchParams({ venue: venue.name, address: venue.address }).toString()}`;
}

function directionsHref(venue: CebuVenue) {
  return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
}

function venueMeta(venue: CebuVenue) {
  return [
    venue.environment ? venue.environment.replace("semi-indoor", "Semi-indoor") : null,
    venue.courtCount ? `${venue.courtCount} ${venue.courtCount === 1 ? "court" : "courts"}` : null,
    venue.priceRange,
  ].filter(Boolean);
}

function SelectedCourtOverlay({
  venue,
  copied,
  onClose,
  onCopy,
}: {
  venue: CebuVenue;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
}) {
  return (
    <aside
      aria-live="polite"
      aria-label={`Selected court: ${venue.name}`}
      className="absolute inset-x-3 bottom-3 z-20 max-h-[calc(100%-80px)] overflow-y-auto rounded-xl border border-line bg-surface p-4 shadow-[0_4px_8px_rgb(13_15_20/.14)] sm:right-auto sm:w-[min(430px,calc(100%-88px))]"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-muted">
            {venue.listingStatus === "verified" ? (
              <CheckCircle aria-hidden className="shrink-0 text-success" size={15} weight="fill" />
            ) : null}
            <span>{venue.listingStatus === "verified" ? "Verified by Relay" : "Confirm details with venue"}</span>
          </div>
          <h2 className="mt-1 text-lg font-[680] tracking-[-0.02em]">{venue.name}</h2>
          <p className="mt-1 text-sm leading-5 text-muted">{venue.address}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close court details"
          className="pressable grid h-9 w-9 shrink-0 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
        >
          <X aria-hidden size={17} />
        </button>
      </div>

      {venueMeta(venue).length ? (
        <p className="mt-3 text-sm font-medium capitalize text-ink">{venueMeta(venue).join(" · ")}</p>
      ) : null}

      <div className="mt-4 grid grid-cols-2 gap-2">
        <Link
          href={createHref(venue)}
          className="pressable inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-white hover:bg-primary-hover"
        >
          <Plus aria-hidden size={15} /> Create game
        </Link>
        <Link
          href={directionsHref(venue)}
          target="_blank"
          rel="noreferrer"
          className="pressable inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-surface-strong"
        >
          <MapPin aria-hidden size={15} /> Directions
        </Link>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        {venue.bookingUrl ? (
          <Link
            href={venue.bookingUrl}
            target="_blank"
            rel="noreferrer"
            className="pressable inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink"
          >
            Booking <ArrowSquareOut aria-hidden size={14} />
          </Link>
        ) : (
          <Link
            href={`/venues/${venue.slug}`}
            className="pressable inline-flex min-h-9 items-center rounded-md px-2 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink"
          >
            View details
          </Link>
        )}
        <Button type="button" variant="quiet" className="text-muted" onClick={onCopy}>
          <Copy aria-hidden size={15} /> {copied ? "Copied" : "Copy location"}
        </Button>
      </div>
    </aside>
  );
}

function CourtResults({
  venues,
  selectedId,
  onSelect,
}: {
  venues: CebuVenue[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    if (selectedId) rowRefs.current.get(selectedId)?.scrollIntoView?.({ block: "nearest" });
  }, [selectedId]);

  return (
    <section
      aria-labelledby="cebu-court-list"
      className="flex h-[560px] min-h-0 flex-col overflow-hidden rounded-xl border border-line bg-surface xl:order-1 xl:h-full"
    >
      <header className="shrink-0 border-b border-line px-4 py-3">
        <h2 id="cebu-court-list" className="text-[15px] font-[680]">
          Courts
        </h2>
        <p className="mt-0.5 text-xs text-muted">
          {venues.length} {venues.length === 1 ? "place" : "places"}
        </p>
      </header>

      {venues.length ? (
        <ul className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain">
          {venues.map((venue) => {
            const active = venue.id === selectedId;
            return (
              <li key={venue.id}>
                <button
                  ref={(element) => {
                    if (element) rowRefs.current.set(venue.id, element);
                    else rowRefs.current.delete(venue.id);
                  }}
                  type="button"
                  onClick={() => onSelect(venue.id)}
                  aria-pressed={active}
                  className={`pressable relative w-full px-4 py-3.5 text-left ${active ? "bg-primary-soft/55 before:absolute before:inset-y-3 before:left-0 before:w-0.5 before:bg-primary" : "hover:bg-surface-strong/60"}`}
                >
                  <span className="flex items-start justify-between gap-3">
                    <strong className="text-sm font-[650] leading-5 text-ink">{venue.name}</strong>
                    {venue.listingStatus === "verified" ? (
                      <CheckCircle
                        aria-label="Verified by Relay"
                        className="mt-0.5 shrink-0 text-success"
                        size={16}
                        weight="fill"
                      />
                    ) : null}
                  </span>
                  <span className="mt-1 block text-xs leading-[18px] text-muted">{venue.address}</span>
                  {venueMeta(venue).length ? (
                    <span className="mt-2 block text-xs font-medium capitalize leading-[18px] text-ink">
                      {venueMeta(venue).join(" · ")}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
          <div>
            <Buildings aria-hidden size={22} className="mx-auto text-primary" />
            <h3 className="mt-3 font-[680]">No courts match</h3>
            <p className="mt-2 text-sm text-muted">Clear the search or try another setting.</p>
          </div>
        </div>
      )}
    </section>
  );
}

export function CourtFinder({ venues }: { venues: CebuVenue[] }) {
  const [query, setQuery] = useState("");
  const [setting, setSetting] = useState<"all" | "indoor" | "outdoor">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const selectionTriggerRef = useRef<HTMLElement | null>(null);
  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    return venues.filter((venue) => {
      const settingMatches = setting === "all" || venue.environment?.includes(setting);
      const queryMatches = !term || `${venue.name} ${venue.address}`.toLowerCase().includes(term);
      return settingMatches && queryMatches;
    });
  }, [query, setting, venues]);
  const selected = filtered.find((venue) => venue.id === selectedId) ?? null;

  function selectCourt(id: string) {
    selectionTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(id);
    setCopied(false);
  }

  function closeSelection() {
    const trigger = selectionTriggerRef.current;
    setSelectedId(null);
    requestAnimationFrame(() => trigger?.focus());
  }

  async function copyLocation(venue: CebuVenue) {
    await navigator.clipboard.writeText(directionsHref(venue));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className="mt-7">
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div>
          <label htmlFor="court-search" className="block text-sm font-[650]">
            Search courts
          </label>
          <div className="relative mt-1.5 max-w-2xl">
            <MagnifyingGlass
              aria-hidden
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
              size={18}
            />
            <input
              id="court-search"
              value={query}
              onChange={(event) => {
                setQuery(event.target.value);
                setSelectedId(null);
              }}
              className="h-11 w-full rounded-lg border border-line bg-surface px-3 pl-10 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
              placeholder="Court name or neighborhood"
              autoComplete="off"
            />
          </div>
        </div>
        <div className="flex min-w-max border-b border-line" aria-label="Court setting filters">
          {(["all", "indoor", "outdoor"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => {
                setSetting(value);
                setSelectedId(null);
              }}
              aria-pressed={setting === value}
              className={`relative min-h-10 px-3 text-[13px] font-semibold capitalize ${setting === value ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:bg-primary" : "text-muted hover:text-ink"}`}
            >
              {value}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-5 grid min-h-0 gap-4 xl:h-[calc(100dvh-360px)] xl:min-h-[620px] xl:grid-cols-[340px_minmax(0,1fr)]">
        <section aria-label="Court map" className="flex min-h-0 flex-col xl:order-2">
          <div className="min-h-0 flex-1">
            <CebuCourtMap venues={filtered} selectedId={selected?.id ?? null} onSelect={selectCourt}>
              {selected ? (
                <SelectedCourtOverlay
                  venue={selected}
                  copied={copied}
                  onClose={closeSelection}
                  onCopy={() => void copyLocation(selected)}
                />
              ) : null}
            </CebuCourtMap>
          </div>
          <p className="mt-2 shrink-0 text-xs leading-5 text-muted">
            Drag to explore. Pinch or use the controls to zoom. Map data © Geoapify, OpenMapTiles, and OpenStreetMap
            contributors.
          </p>
        </section>

        <CourtResults venues={filtered} selectedId={selected?.id ?? null} onSelect={selectCourt} />
      </div>
    </div>
  );
}
