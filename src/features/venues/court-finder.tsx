"use client";

import {
  ArrowSquareOut,
  Buildings,
  Car,
  CheckCircle,
  Clock,
  Copy,
  Crosshair,
  List,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Plus,
  Racquet,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

import { CebuCourtMap } from "./cebu-court-map";
import { distanceInKilometers, formatDistance } from "./distance";
import type { CebuVenue } from "./queries";

type UserLocation = { latitude: number; longitude: number };
type LocationStatus = "idle" | "loading" | "ready" | "error";
type CourtView = "map" | "list";
type CourtResult = { venue: CebuVenue; distance: number | null };

function createHref(venue: CebuVenue, isAuthenticated: boolean) {
  const gamePath = `/games/new?${new URLSearchParams({ venue: venue.name, address: venue.address }).toString()}`;
  return isAuthenticated ? gamePath : `/signup?next=${encodeURIComponent(gamePath)}`;
}

function directionsHref(venue: CebuVenue) {
  return `https://www.google.com/maps/search/?api=1&query=${venue.latitude},${venue.longitude}`;
}

function environmentLabel(environment: string | null) {
  if (!environment) return null;
  if (environment === "semi-indoor") return "Semi-indoor";
  return environment.slice(0, 1).toUpperCase() + environment.slice(1);
}

function venueMeta(venue: CebuVenue) {
  return [
    environmentLabel(venue.environment),
    venue.courtCount ? `${venue.courtCount} ${venue.courtCount === 1 ? "court" : "courts"}` : null,
    venue.priceRange,
    venue.paddleRental ? "Paddle rental" : null,
  ].filter(Boolean);
}

function SelectedCourtOverlay({
  result,
  copied,
  onClose,
  onCopy,
  isAuthenticated,
  detailBasePath,
}: {
  result: CourtResult;
  copied: boolean;
  onClose: () => void;
  onCopy: () => void;
  isAuthenticated: boolean;
  detailBasePath: "/court" | "/courts";
}) {
  const { venue, distance } = result;
  const hours = venue.hours?.summary;
  const facts = [
    hours ? { label: "Hours", value: hours, icon: Clock } : null,
    venue.parking ? { label: "Parking", value: venue.parking, icon: Car } : null,
    venue.paddleRental ? { label: "Paddles", value: "Rental available", icon: Racquet } : null,
  ].filter((item): item is NonNullable<typeof item> => Boolean(item));

  return (
    <aside
      aria-live="polite"
      aria-label={`Selected court: ${venue.name}`}
      className="absolute inset-x-3 bottom-3 z-20 max-h-[calc(100%-72px)] overflow-y-auto rounded-xl border border-line bg-surface p-4 shadow-[0_4px_8px_rgb(13_15_20/.14)] sm:right-auto sm:w-[min(460px,calc(100%-88px))]"
    >
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-semibold text-muted">
            {venue.listingStatus === "verified" ? (
              <span className="inline-flex items-center gap-1 text-success">
                <CheckCircle aria-hidden size={15} weight="fill" /> Verified by Relay
              </span>
            ) : (
              <span>Community listing · Confirm details</span>
            )}
            {distance != null ? <span>{formatDistance(distance)} away</span> : null}
          </div>
          <h2 className="mt-1.5 text-lg font-[680] tracking-[-0.02em]">{venue.name}</h2>
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
        <p className="mt-3 text-sm font-medium text-ink">{venueMeta(venue).join(" · ")}</p>
      ) : null}

      {facts.length ? (
        <dl className="mt-4 grid divide-y divide-line border-y border-line sm:grid-cols-2 sm:divide-x sm:divide-y-0">
          {facts.slice(0, 2).map(({ label, value, icon: Icon }, index) => (
            <div key={label} className={`flex gap-2.5 py-3 ${index ? "sm:pl-4" : "sm:pr-4"}`}>
              <Icon aria-hidden className="mt-0.5 shrink-0 text-primary" size={17} />
              <div className="min-w-0">
                <dt className="text-xs font-medium text-muted">{label}</dt>
                <dd className="mt-0.5 text-xs font-semibold leading-5 text-ink">{value}</dd>
              </div>
            </div>
          ))}
        </dl>
      ) : null}

      <div className="mt-4 grid gap-2 min-[420px]:grid-cols-2">
        <Link
          href={createHref(venue, isAuthenticated)}
          className="pressable inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg bg-primary px-3 text-[13px] font-semibold text-white hover:bg-primary-hover"
        >
          <Plus aria-hidden size={15} /> Plan a game here
        </Link>
        <Link
          href={directionsHref(venue)}
          target="_blank"
          rel="noopener noreferrer"
          className="pressable inline-flex min-h-10 items-center justify-center gap-1.5 rounded-lg border border-line bg-surface px-3 text-[13px] font-semibold text-ink hover:bg-surface-strong"
        >
          <MapPin aria-hidden size={15} /> Directions
        </Link>
      </div>
      <div className="mt-1 flex flex-wrap items-center gap-1">
        <Link
          href={`${detailBasePath}/${venue.slug}`}
          className="pressable inline-flex min-h-9 items-center rounded-md px-2 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink"
        >
          Court details
        </Link>
        {venue.bookingUrl ? (
          <Link
            href={venue.bookingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="pressable inline-flex min-h-9 items-center gap-1.5 rounded-md px-2 text-[13px] font-semibold text-muted hover:bg-surface-strong hover:text-ink"
          >
            External booking <ArrowSquareOut aria-hidden size={14} />
          </Link>
        ) : null}
        <Button type="button" variant="quiet" className="text-muted" onClick={onCopy}>
          <Copy aria-hidden size={15} /> {copied ? "Copied" : "Copy location"}
        </Button>
      </div>
    </aside>
  );
}

function CourtResults({
  results,
  selectedId,
  locationReady,
  onSelect,
  onClear,
  compactPreview,
  mobileEdgeToEdge,
  compactHeader,
  suggestHref,
}: {
  results: CourtResult[];
  selectedId: string | null;
  locationReady: boolean;
  onSelect: (id: string) => void;
  onClear: () => void;
  compactPreview: boolean;
  mobileEdgeToEdge: boolean;
  compactHeader: boolean;
  suggestHref: string | null;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const rowRefs = useRef(new Map<string, HTMLButtonElement>());

  useEffect(() => {
    const list = listRef.current;
    const row = selectedId ? rowRefs.current.get(selectedId) : null;
    if (!list || !row) return;
    const rowTop = row.offsetTop;
    const rowBottom = rowTop + row.offsetHeight;
    if (rowTop < list.scrollTop) list.scrollTo({ top: rowTop });
    else if (rowBottom > list.scrollTop + list.clientHeight) list.scrollTo({ top: rowBottom - list.clientHeight });
  }, [selectedId]);

  return (
    <section
      aria-labelledby="cebu-court-list"
      className={`flex min-h-0 flex-col overflow-hidden border border-line bg-surface sm:rounded-xl xl:order-1 xl:h-full ${mobileEdgeToEdge ? "border-x-0 sm:border-x" : "rounded-xl"} ${compactPreview ? "h-[360px] sm:h-[420px]" : "h-[min(60dvh,520px)] min-h-[400px] sm:h-[580px]"}`}
    >
      <header
        className={`${compactHeader ? "hidden xl:flex" : "flex"} shrink-0 items-end justify-between gap-3 border-b border-line px-4 py-3`}
      >
        <div>
          <h2 id="cebu-court-list" className="text-[15px] font-[680]">
            {locationReady ? "Nearest courts" : "Courts"}
          </h2>
          <p className="mt-0.5 text-xs text-muted">
            {results.length} {results.length === 1 ? "place" : "places"}
            {locationReady ? " · nearest first" : ""}
          </p>
        </div>
        {!results.length ? (
          <button type="button" onClick={onClear} className="min-h-9 text-xs font-semibold text-primary">
            Clear filters
          </button>
        ) : null}
      </header>

      {results.length ? (
        <ul ref={listRef} className="min-h-0 flex-1 divide-y divide-line overflow-y-auto overscroll-contain">
          {results.map(({ venue, distance }) => {
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
                    <span className="shrink-0 text-right">
                      {distance != null ? (
                        <span className="block text-xs font-semibold text-primary">{formatDistance(distance)}</span>
                      ) : null}
                      {venue.listingStatus === "verified" ? (
                        <CheckCircle
                          aria-label="Verified by Relay"
                          className="ml-auto mt-1 text-success"
                          size={15}
                          weight="fill"
                        />
                      ) : null}
                    </span>
                  </span>
                  <span className="mt-1 block text-xs leading-[18px] text-muted">{venue.address}</span>
                  {venueMeta(venue).length ? (
                    <span className="mt-2 block text-xs font-medium leading-[18px] text-ink">
                      {venueMeta(venue).join(" · ")}
                    </span>
                  ) : null}
                </button>
              </li>
            );
          })}
          {suggestHref ? (
            <li className="xl:hidden">
              <Link
                href={suggestHref}
                className="pressable flex min-h-14 items-center justify-between gap-3 px-4 py-3 text-sm font-semibold text-muted hover:bg-surface-strong hover:text-ink"
              >
                Can’t find your court? <span className="text-primary">Suggest it</span>
              </Link>
            </li>
          ) : null}
        </ul>
      ) : (
        <div className="grid min-h-0 flex-1 place-items-center px-6 text-center">
          <div>
            <Buildings aria-hidden size={22} className="mx-auto text-primary" />
            <h3 className="mt-3 font-[680]">No courts match</h3>
            <p className="mt-2 text-sm text-muted">Try another neighborhood or clear the active filters.</p>
            {suggestHref ? (
              <Link
                href={suggestHref}
                className="pressable mt-4 inline-flex min-h-11 items-center rounded-lg px-3 text-sm font-semibold text-primary hover:bg-primary-soft"
              >
                Suggest a court
              </Link>
            ) : null}
          </div>
        </div>
      )}
    </section>
  );
}

export function CourtFinder({
  venues,
  isAuthenticated = false,
  detailBasePath = "/court",
  showFilterTopBorder = true,
  compactPreview = false,
  className = "mt-7",
}: {
  venues: CebuVenue[];
  isAuthenticated?: boolean;
  detailBasePath?: "/court" | "/courts";
  showFilterTopBorder?: boolean;
  compactPreview?: boolean;
  className?: string;
}) {
  const [query, setQuery] = useState("");
  const [setting, setSetting] = useState<"all" | "indoor" | "outdoor">("all");
  const [paddleRentalOnly, setPaddleRentalOnly] = useState(false);
  const [verifiedOnly, setVerifiedOnly] = useState(false);
  const [mobileView, setMobileView] = useState<CourtView>("map");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [userLocation, setUserLocation] = useState<UserLocation | null>(null);
  const [locationStatus, setLocationStatus] = useState<LocationStatus>("idle");
  const [locationMessage, setLocationMessage] = useState("");
  const selectionTriggerRef = useRef<HTMLElement | null>(null);
  const mapSectionRef = useRef<HTMLElement>(null);

  const results = useMemo(() => {
    const term = query.trim().toLowerCase();
    const matching = venues
      .filter((venue) => {
        const indoor =
          venue.environment === "indoor" || venue.environment === "semi-indoor" || venue.environment === "covered";
        const settingMatches = setting === "all" || (setting === "indoor" ? indoor : venue.environment === "outdoor");
        const queryMatches =
          !term ||
          `${venue.name} ${venue.address} ${venue.priceRange ?? ""} ${venue.amenities.join(" ")}`
            .toLowerCase()
            .includes(term);
        return (
          settingMatches &&
          queryMatches &&
          (!paddleRentalOnly || venue.paddleRental) &&
          (!verifiedOnly || venue.listingStatus === "verified")
        );
      })
      .map((venue) => ({
        venue,
        distance: userLocation ? distanceInKilometers(userLocation, venue) : null,
      }));
    if (userLocation) matching.sort((left, right) => (left.distance ?? 0) - (right.distance ?? 0));
    return matching;
  }, [paddleRentalOnly, query, setting, userLocation, venues, verifiedOnly]);

  const selected = results.find(({ venue }) => venue.id === selectedId) ?? null;
  const filtersActive = Boolean(query.trim() || setting !== "all" || paddleRentalOnly || verifiedOnly);

  function selectCourt(id: string, revealMap = false) {
    selectionTriggerRef.current = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    setSelectedId(id);
    setCopied(false);
    if (revealMap && window.innerWidth < 1280) {
      setMobileView("map");
      const reducedMotion = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches ?? false;
      requestAnimationFrame(() =>
        mapSectionRef.current?.scrollIntoView?.({ block: "start", behavior: reducedMotion ? "auto" : "smooth" }),
      );
    }
  }

  function closeSelection() {
    const trigger = selectionTriggerRef.current;
    setSelectedId(null);
    requestAnimationFrame(() => trigger?.focus());
  }

  function clearFilters() {
    setQuery("");
    setSetting("all");
    setPaddleRentalOnly(false);
    setVerifiedOnly(false);
    setSelectedId(null);
  }

  function useLocation() {
    if (userLocation) {
      setUserLocation(null);
      setLocationStatus("idle");
      setLocationMessage("");
      return;
    }
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationMessage("Location isn’t available here. Search by neighborhood instead.");
      return;
    }
    setLocationStatus("loading");
    setLocationMessage("");
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setUserLocation({ latitude: coords.latitude, longitude: coords.longitude });
        setLocationStatus("ready");
        setLocationMessage("Courts are now sorted by distance. Your location stays on this device.");
      },
      () => {
        setLocationStatus("error");
        setLocationMessage("Location access is off. Search by court or neighborhood instead.");
      },
      { enableHighAccuracy: false, timeout: 8000, maximumAge: 300000 },
    );
  }

  async function copyLocation(venue: CebuVenue) {
    await navigator.clipboard.writeText(directionsHref(venue));
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div className={className}>
      <section
        aria-label="Find and filter courts"
        className={`${showFilterTopBorder ? "border-b lg:border-y" : "border-b"} border-line pb-3 lg:py-4`}
      >
        <div className="grid grid-cols-[minmax(0,1fr)_44px] items-end gap-2 lg:grid-cols-[minmax(0,1fr)_auto] lg:gap-3">
          <div>
            <label htmlFor="court-search" className="sr-only lg:not-sr-only lg:block lg:text-sm lg:font-[650]">
              Search courts
            </label>
            <div className="relative max-w-2xl lg:mt-1.5">
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
                className="h-11 w-full rounded-lg border border-line bg-surface px-10 text-[15px] text-ink placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
                placeholder="Court name, neighborhood, or amenity"
                autoComplete="off"
              />
              {query ? (
                <button
                  type="button"
                  onClick={() => {
                    setQuery("");
                    setSelectedId(null);
                  }}
                  aria-label="Clear court search"
                  className="absolute right-1.5 top-1/2 grid h-8 w-8 -translate-y-1/2 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
                >
                  <X aria-hidden size={15} />
                </button>
              ) : null}
            </div>
          </div>
          <Button
            type="button"
            variant="secondary"
            onClick={useLocation}
            disabled={locationStatus === "loading"}
            aria-pressed={Boolean(userLocation)}
            aria-label={
              locationStatus === "loading"
                ? "Finding your location"
                : userLocation
                  ? "Stop sorting by distance"
                  : "Use my location"
            }
            className="h-11 w-11 px-0 lg:h-auto lg:w-auto lg:px-3"
          >
            <Crosshair aria-hidden size={17} />
            <span className="hidden lg:inline">
              {locationStatus === "loading" ? "Finding you…" : userLocation ? "Nearest first" : "Use my location"}
            </span>
          </Button>
        </div>

        <div className="public-session-scroll -mx-1 mt-3 overflow-x-auto px-1 pb-1">
          <div className="flex min-w-max gap-2" aria-label="Court filters">
            {(["all", "indoor", "outdoor"] as const).map((value) => {
              const selected = setting === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => {
                    setSetting(value);
                    setSelectedId(null);
                  }}
                  aria-pressed={selected}
                  className={`pressable inline-flex min-h-9 items-center rounded-full border px-3.5 text-[13px] font-semibold ${selected ? "border-primary/20 bg-primary-soft text-primary-hover" : "border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink"}`}
                >
                  {value === "all" ? "All" : value === "indoor" ? "Indoor" : "Outdoor"}
                </button>
              );
            })}
            <label
              className={`pressable inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 text-[13px] font-semibold ${paddleRentalOnly ? "border-primary/20 bg-primary-soft text-primary-hover" : "border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink"}`}
            >
              <input
                type="checkbox"
                checked={paddleRentalOnly}
                onChange={(event) => {
                  setPaddleRentalOnly(event.target.checked);
                  setSelectedId(null);
                }}
                className="sr-only"
              />
              Paddle rental
            </label>
            <label
              className={`pressable inline-flex min-h-9 cursor-pointer items-center rounded-full border px-3.5 text-[13px] font-semibold ${verifiedOnly ? "border-primary/20 bg-primary-soft text-primary-hover" : "border-line bg-surface text-muted hover:bg-surface-strong hover:text-ink"}`}
            >
              <input
                type="checkbox"
                checked={verifiedOnly}
                onChange={(event) => {
                  setVerifiedOnly(event.target.checked);
                  setSelectedId(null);
                }}
                className="sr-only"
              />
              Verified
            </label>
            {filtersActive ? (
              <button
                type="button"
                onClick={clearFilters}
                className="pressable min-h-9 rounded-full px-3 text-[13px] font-semibold text-primary hover:bg-primary-soft"
              >
                Clear
              </button>
            ) : null}
          </div>
        </div>
        {locationMessage ? (
          <p role="status" className={`mt-3 text-xs ${locationStatus === "error" ? "text-warning" : "text-muted"}`}>
            {locationMessage}
          </p>
        ) : null}
      </section>

      {!compactPreview ? (
        <div className="flex items-center justify-between gap-3 py-2 xl:hidden">
          <div aria-live="polite" className="min-w-0">
            <p className="truncate text-sm font-[680]">{userLocation ? "Nearest courts" : "Courts"}</p>
            <p className="mt-0.5 text-xs text-muted">
              {results.length} {results.length === 1 ? "place" : "places"}
            </p>
          </div>
          <div
            role="group"
            aria-label="Court view"
            className="inline-flex shrink-0 rounded-lg border border-line bg-surface-strong p-0.5"
          >
            {(
              [
                { value: "map", label: "Map", icon: MapTrifold },
                { value: "list", label: "List", icon: List },
              ] as const
            ).map(({ value, label, icon: Icon }) => (
              <button
                key={value}
                type="button"
                aria-pressed={mobileView === value}
                onClick={() => setMobileView(value)}
                className={`pressable inline-flex h-11 items-center gap-1.5 rounded-md px-3 text-[13px] font-semibold ${mobileView === value ? "bg-surface text-ink shadow-[0_1px_4px_oklch(0.1_0.02_250/.08)]" : "text-muted hover:text-ink"}`}
              >
                <Icon aria-hidden size={17} />
                {label}
              </button>
            ))}
          </div>
        </div>
      ) : null}

      <div
        className={`grid min-h-0 gap-3 sm:gap-4 xl:grid-cols-[360px_minmax(0,1fr)] ${compactPreview ? "mt-3 xl:h-[440px]" : "-mx-4 sm:mx-0 xl:mt-4 xl:flex-1"}`}
      >
        <section
          ref={mapSectionRef}
          tabIndex={-1}
          aria-label="Court map"
          className={`${compactPreview || mobileView === "map" ? "flex" : "hidden xl:flex"} min-h-0 scroll-mt-20 flex-col outline-none xl:order-2`}
        >
          <div className="min-h-0 flex-1">
            <CebuCourtMap
              venues={results.map(({ venue }) => venue)}
              selectedId={selected?.venue.id ?? null}
              userLocation={userLocation}
              onSelect={selectCourt}
              compactPreview={compactPreview}
              mobileEdgeToEdge={!compactPreview}
            >
              {selected ? (
                <SelectedCourtOverlay
                  result={selected}
                  copied={copied}
                  onClose={closeSelection}
                  onCopy={() => void copyLocation(selected.venue)}
                  isAuthenticated={isAuthenticated}
                  detailBasePath={detailBasePath}
                />
              ) : null}
            </CebuCourtMap>
          </div>
          <p className="mt-2 hidden shrink-0 text-xs leading-5 text-muted sm:block">
            Drag to explore. Select a pin for details. Map data © Geoapify, OpenMapTiles, and OpenStreetMap
            contributors.
          </p>
        </section>

        <div
          data-court-list-pane
          className={`${compactPreview || mobileView === "list" ? "block" : "hidden xl:block"} min-h-0 xl:order-1 xl:h-full`}
        >
          <CourtResults
            results={results}
            selectedId={selected?.venue.id ?? null}
            locationReady={Boolean(userLocation)}
            onSelect={(id) => selectCourt(id, true)}
            onClear={clearFilters}
            compactPreview={compactPreview}
            mobileEdgeToEdge={!compactPreview}
            compactHeader={!compactPreview}
            suggestHref={isAuthenticated && !compactPreview ? "/court/suggest" : null}
          />
        </div>
      </div>
    </div>
  );
}
