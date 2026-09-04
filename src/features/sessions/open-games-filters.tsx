"use client";

import { CalendarBlank, Clock, UsersThree, X } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import {
  DatePickerField,
  TimePickerField,
} from "@/components/ui/date-time-picker";
import { SelectField } from "@/components/ui/select-field";

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

export function OpenGamesFilters({ filters }: { filters: OpenGamesFilters }) {
  const router = useRouter();
  const [location, setLocation] = useState(filters.location);
  const hasFilters = Boolean(
    filters.date !== "any" || filters.time !== "any" || filters.available
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
