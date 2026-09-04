"use client";

import {
  CalendarBlank,
  CaretDown,
  Clock,
  CurrencyCircleDollar,
  UsersThree,
  X,
} from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";

import {
  DatePickerField,
  TimePickerField,
} from "@/components/ui/date-time-picker";
import { SelectField } from "@/components/ui/select-field";
import { usePopoverTransition } from "@/components/ui/use-popover-transition";

import { GameDesktopViewControls } from "./game-view-menu";
import {
  type OpenGamesFilters,
  openGameDateFilters,
  openGameTimeFilters,
} from "./open-games";

const dateLabels = {
  any: "Any date",
  today: "Today",
  "7d": "Next 7 days",
  "30d": "Next 30 days",
  custom: "Choose a date range",
};
const timeLabels = {
  any: "Any time",
  morning: "Morning",
  afternoon: "Afternoon",
  evening: "Evening",
  custom: "Choose a time range",
};

function priceInputCents(value: string): number | null | undefined {
  if (!value) return null;
  if (!/^\d{1,6}(?:\.\d{1,2})?$/.test(value)) return;
  const cents = Number(value) * 100;
  return cents >= 1 && cents <= 10_000_000 ? cents : undefined;
}

function priceFilterLabel(filters: OpenGamesFilters) {
  if (filters.price === "any") return "Price";
  if (filters.price === "free") return "Free";
  const minimum = filters.minPrice === null ? null : filters.minPrice / 100;
  const maximum = filters.maxPrice === null ? null : filters.maxPrice / 100;
  if (minimum !== null && maximum !== null)
    return `₱${minimum.toLocaleString()}–₱${maximum.toLocaleString()}`;
  if (minimum !== null) return `₱${minimum.toLocaleString()}+`;
  if (maximum !== null) return `Up to ₱${maximum.toLocaleString()}`;
  return "Paid";
}

function PriceFilter({
  filters,
  onApply,
}: {
  filters: OpenGamesFilters;
  onApply: (next: Partial<OpenGamesFilters>) => void;
}) {
  const { open, rendered, show, hide } = usePopoverTransition();
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const popoverId = useId();
  const [price, setPrice] = useState(filters.price);
  const [minimum, setMinimum] = useState(
    filters.minPrice === null ? "" : String(filters.minPrice / 100)
  );
  const [maximum, setMaximum] = useState(
    filters.maxPrice === null ? "" : String(filters.maxPrice / 100)
  );
  const [rangeError, setRangeError] = useState("");

  const resetDraft = useCallback(() => {
    setPrice(filters.price);
    setMinimum(filters.minPrice === null ? "" : String(filters.minPrice / 100));
    setMaximum(filters.maxPrice === null ? "" : String(filters.maxPrice / 100));
    setRangeError("");
  }, [filters.maxPrice, filters.minPrice, filters.price]);

  const close = useCallback(() => {
    hide();
    resetDraft();
  }, [hide, resetDraft]);

  useEffect(() => {
    if (!open) return;
    const closeOutside = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) close();
    };
    const closeWithEscape = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      close();
      trigger.current?.focus();
    };
    document.addEventListener("pointerdown", closeOutside);
    document.addEventListener("keydown", closeWithEscape);
    return () => {
      document.removeEventListener("pointerdown", closeOutside);
      document.removeEventListener("keydown", closeWithEscape);
    };
  }, [close, open]);

  const active = filters.price !== "any";

  return (
    <div ref={root} className="relative">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls={popoverId}
        aria-haspopup="dialog"
        onClick={() => {
          if (open) close();
          else {
            resetDraft();
            show();
            window.requestAnimationFrame(() =>
              root.current
                ?.querySelector<HTMLInputElement>('input[name="price"]:checked')
                ?.focus()
            );
          }
        }}
        className={`compact-control pressable inline-flex h-9 min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold sm:text-[13px] ${
          active
            ? "border-primary/20 bg-primary-soft text-primary-hover"
            : "border-line bg-surface text-ink hover:bg-surface-strong"
        }`}
      >
        <CurrencyCircleDollar aria-hidden size={14} />
        {priceFilterLabel(filters)}
        <CaretDown
          aria-hidden
          size={12}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {rendered ? (
        <div
          id={popoverId}
          role="dialog"
          aria-label="Price filter"
          aria-hidden={!open}
          inert={!open}
          data-state={open ? "open" : "closed"}
          className="menu-popover fixed inset-x-4 bottom-[max(1rem,env(safe-area-inset-bottom))] z-50 rounded-xl border border-line bg-surface p-4 shadow-[0_8px_24px_rgb(13_15_20/.14)] sm:absolute sm:inset-x-auto sm:bottom-auto sm:left-0 sm:top-[calc(100%+.5rem)] sm:w-72"
        >
          <form
            noValidate
            onSubmit={(event) => {
              event.preventDefault();
              let minPrice: number | null = null;
              let maxPrice: number | null = null;
              if (price === "paid") {
                const min = priceInputCents(minimum);
                const max = priceInputCents(maximum);
                if (min === undefined || max === undefined) {
                  setRangeError(
                    "Use amounts from ₱0.01 to ₱100,000 with up to 2 decimal places."
                  );
                  return;
                }
                if (min !== null && max !== null && min > max) {
                  setRangeError("Maximum must be at least the minimum.");
                  return;
                }
                minPrice = min;
                maxPrice = max;
              }
              onApply({ price, minPrice, maxPrice });
              hide();
              trigger.current?.focus();
            }}
          >
            <fieldset>
              <legend className="text-sm font-semibold">Price</legend>
              <div className="mt-2 flex gap-2">
                {[
                  ["any", "Any"],
                  ["free", "Free"],
                  ["paid", "Paid"],
                ].map(([value, label]) => (
                  <label
                    key={value}
                    className={`flex min-h-10 flex-1 cursor-pointer items-center justify-center rounded-lg border px-2 text-sm font-semibold has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary has-[:focus-visible]:ring-offset-2 ${price === value ? "border-primary bg-primary-soft text-primary" : "border-line"}`}
                  >
                    <input
                      type="radio"
                      name="price"
                      value={value}
                      checked={price === value}
                      onChange={() => {
                        setPrice(value as OpenGamesFilters["price"]);
                        setRangeError("");
                      }}
                      className="sr-only"
                    />
                    {label}
                  </label>
                ))}
              </div>
            </fieldset>
            {price === "paid" ? (
              <div className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  <label className="text-sm font-semibold">
                    Minimum
                    <span className="mt-1.5 flex h-10 items-center rounded-lg border border-line bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                      <span className="text-muted">₱</span>
                      <input
                        aria-invalid={Boolean(rangeError)}
                        type="number"
                        min="0.01"
                        max="100000"
                        step="0.01"
                        inputMode="decimal"
                        value={minimum}
                        onChange={(event) => {
                          setMinimum(event.target.value);
                          setRangeError("");
                        }}
                        placeholder="0"
                        className="score min-w-0 flex-1 bg-transparent pl-1 outline-none focus-visible:!outline-none"
                      />
                    </span>
                  </label>
                  <label className="text-sm font-semibold">
                    Maximum
                    <span className="mt-1.5 flex h-10 items-center rounded-lg border border-line bg-surface px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary/15">
                      <span className="text-muted">₱</span>
                      <input
                        aria-invalid={Boolean(rangeError)}
                        type="number"
                        min="0.01"
                        max="100000"
                        step="0.01"
                        inputMode="decimal"
                        value={maximum}
                        onChange={(event) => {
                          setMaximum(event.target.value);
                          setRangeError("");
                        }}
                        placeholder="Any"
                        className="score min-w-0 flex-1 bg-transparent pl-1 outline-none focus-visible:!outline-none"
                      />
                    </span>
                  </label>
                </div>
                <p className="mt-2 text-xs leading-5 text-muted">
                  Leave either amount blank for an open-ended range.
                </p>
                {rangeError ? (
                  <p role="alert" className="mt-2 text-sm text-danger">
                    {rangeError}
                  </p>
                ) : null}
              </div>
            ) : null}
            <div className="mt-4 flex items-center justify-between border-t border-line pt-3">
              <button
                type="button"
                onClick={() => {
                  onApply({ price: "any", minPrice: null, maxPrice: null });
                  hide();
                  trigger.current?.focus();
                }}
                className="min-h-9 px-2 text-sm font-semibold text-muted hover:text-ink"
              >
                Clear
              </button>
              <button
                type="submit"
                className="min-h-9 rounded-lg bg-primary px-3 text-sm font-semibold text-white hover:bg-primary-hover"
              >
                Apply price
              </button>
            </div>
          </form>
        </div>
      ) : null}
    </div>
  );
}

export function OpenGamesFilters({ filters }: { filters: OpenGamesFilters }) {
  const router = useRouter();
  const [location, setLocation] = useState(filters.location);
  const hasFilters = Boolean(
    filters.date !== "any" ||
      filters.time !== "any" ||
      filters.available ||
      filters.price !== "any"
  );
  const clearFiltersParams = new URLSearchParams();
  if (filters.location) clearFiltersParams.set("location", filters.location);
  const clearFiltersQuery = clearFiltersParams.toString();
  const clearFiltersHref = clearFiltersQuery
    ? `/games/open?${clearFiltersQuery}`
    : "/games/open";

  const updateFilters = useCallback(
    (next: Partial<OpenGamesFilters>) => {
      const values = { ...filters, location, ...next };
      const params = new URLSearchParams(window.location.search);
      for (const key of [
        "location",
        "date",
        "dateFrom",
        "dateTo",
        "time",
        "timeFrom",
        "timeTo",
        "available",
        "price",
        "minPrice",
        "maxPrice",
      ])
        params.delete(key);
      if (values.location.trim())
        params.set("location", values.location.trim());
      if (values.date !== "any") params.set("date", values.date);
      if (values.date === "custom") {
        if (values.dateFrom) params.set("dateFrom", values.dateFrom);
        if (values.dateTo) params.set("dateTo", values.dateTo);
      }
      if (values.time !== "any") params.set("time", values.time);
      if (values.time === "custom") {
        if (values.timeFrom) params.set("timeFrom", values.timeFrom);
        if (values.timeTo) params.set("timeTo", values.timeTo);
      }
      if (values.available) params.set("available", "1");
      if (values.price !== "any") params.set("price", values.price);
      if (values.price === "paid") {
        if (values.minPrice !== null)
          params.set("minPrice", String(values.minPrice / 100));
        if (values.maxPrice !== null)
          params.set("maxPrice", String(values.maxPrice / 100));
      }
      const query = params.toString();
      router.replace(query ? `/games/open?${query}` : "/games/open", {
        scroll: false,
      });
    },
    [filters, location, router]
  );

  useEffect(() => setLocation(filters.location), [filters.location]);

  useEffect(() => {
    if (location === filters.location) return;
    const timeout = window.setTimeout(() => updateFilters({ location }), 300);
    return () => window.clearTimeout(timeout);
  }, [filters.location, location, updateFilters]);

  return (
    <section aria-label="Open game filters" className="mt-6">
      <form
        noValidate
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          updateFilters({ location });
        }}
      >
        <label htmlFor="open-location" className="block text-sm font-semibold">
          Court or location
        </label>
        <div className="relative mt-1.5">
          <input
            id="open-location"
            name="location"
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            maxLength={80}
            autoComplete="off"
            placeholder="Search a court, city, or neighborhood…"
            className="h-11 w-full rounded-lg border border-line bg-surface px-3 pr-11 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
          {location ? (
            <button
              type="button"
              aria-label="Clear location search"
              onClick={() => {
                setLocation("");
                updateFilters({ location: "" });
              }}
              className="pressable absolute right-0 top-0 grid h-11 w-11 place-items-center rounded-lg text-muted hover:text-ink"
            >
              <X aria-hidden size={16} />
            </button>
          ) : null}
        </div>
      </form>

      <div className="mt-3 flex items-start gap-3">
        <div
          role="group"
          aria-label="Filter open games"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        >
          <SelectField
            id="open-date"
            name="date"
            label="Date"
            hideLabel
            density="compact"
            leadingIcon={<CalendarBlank aria-hidden size={14} />}
            value={filters.date}
            onValueChange={(date) =>
              updateFilters({ date: date as OpenGamesFilters["date"] })
            }
            options={openGameDateFilters.map((value) => ({
              value,
              label: dateLabels[value],
            }))}
            className="compact-control mt-0 h-9 min-h-9 !w-auto !rounded-full px-3 text-xs font-semibold sm:text-[13px]"
          />
          <SelectField
            id="open-time"
            name="time"
            label="Time"
            hideLabel
            density="compact"
            leadingIcon={<Clock aria-hidden size={14} />}
            value={filters.time}
            onValueChange={(time) =>
              updateFilters({ time: time as OpenGamesFilters["time"] })
            }
            options={openGameTimeFilters.map((value) => ({
              value,
              label: timeLabels[value],
            }))}
            className="compact-control mt-0 h-9 min-h-9 !w-auto !rounded-full px-3 text-xs font-semibold sm:text-[13px]"
          />
          <PriceFilter filters={filters} onApply={updateFilters} />
          <button
            type="button"
            aria-pressed={filters.available}
            onClick={() => updateFilters({ available: !filters.available })}
            className={`compact-control pressable inline-flex h-9 min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold sm:text-[13px] ${
              filters.available
                ? "border-primary/20 bg-primary-soft text-primary-hover"
                : "border-line bg-surface text-ink hover:bg-surface-strong"
            }`}
          >
            <UsersThree aria-hidden size={14} />
            Spots available
          </button>
          {hasFilters ? (
            <Link
              href={clearFiltersHref}
              className="compact-control pressable inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-primary hover:bg-primary-soft sm:text-[13px]"
            >
              Clear filters
            </Link>
          ) : null}
        </div>
        <span className="hidden shrink-0 sm:block">
          <GameDesktopViewControls />
        </span>
      </div>

      {filters.date === "custom" || filters.time === "custom" ? (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {filters.date === "custom" ? (
            <fieldset className="contents">
              <legend className="sr-only">Date range</legend>
              <DatePickerField
                id="open-date-from"
                name="dateFrom"
                label="From date"
                hideLabel
                density="compact"
                className="!w-auto"
                placeholder="From date"
                value={filters.dateFrom}
                onValueChange={(dateFrom) => updateFilters({ dateFrom })}
              />
              <DatePickerField
                id="open-date-to"
                name="dateTo"
                label="Until date"
                hideLabel
                density="compact"
                className="!w-auto"
                placeholder="Until date"
                value={filters.dateTo}
                minValue={filters.dateFrom || undefined}
                onValueChange={(dateTo) => updateFilters({ dateTo })}
              />
            </fieldset>
          ) : null}
          {filters.time === "custom" ? (
            <fieldset className="contents">
              <legend className="sr-only">Start time range</legend>
              <TimePickerField
                id="open-time-from"
                name="timeFrom"
                label="From time"
                hideLabel
                density="compact"
                className="!w-auto"
                placeholder="From time"
                value={filters.timeFrom}
                beforeValue={filters.timeTo || undefined}
                onValueChange={(timeFrom) => updateFilters({ timeFrom })}
              />
              <TimePickerField
                id="open-time-to"
                name="timeTo"
                label="Until time"
                hideLabel
                density="compact"
                className="!w-auto"
                placeholder="Until time"
                value={filters.timeTo}
                afterValue={filters.timeFrom || undefined}
                onValueChange={(timeTo) => updateFilters({ timeTo })}
              />
            </fieldset>
          ) : null}
        </div>
      ) : null}
    </section>
  );
}
