"use client";

import { CalendarBlank, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useState } from "react";

import { SelectField } from "@/components/ui/select-field";

import { type OpenGamesFilters, openGameDateFilters } from "./open-games";

const dateLabels = {
  any: "Any date",
  today: "Today",
  "7d": "Next 7 days",
  "30d": "Next 30 days",
};

export function OpenGamesFilters({ filters }: { filters: OpenGamesFilters }) {
  const router = useRouter();
  const [location, setLocation] = useState(filters.location);
  const hasFilters = Boolean(
    filters.location || filters.date !== "any" || filters.available
  );

  const updateFilters = useCallback(
    (next: Partial<OpenGamesFilters>) => {
      const values = { ...filters, location, ...next };
      const params = new URLSearchParams();
      if (values.location.trim())
        params.set("location", values.location.trim());
      if (values.date !== "any") params.set("date", values.date);
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
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          updateFilters({ location });
        }}
      >
        <label htmlFor="open-location" className="block text-sm font-semibold">
          Court or location
        </label>
        <input
          id="open-location"
          name="location"
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          maxLength={80}
          autoComplete="off"
          placeholder="Search a court, city, or neighborhood…"
          className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
        />
      </form>

      <div className="mt-3">
        <div
          className="focus-scroll-rail public-session-scroll -mx-1 overflow-x-auto px-1"
          onFocusCapture={(event) =>
            event.target.scrollIntoView({ block: "nearest", inline: "nearest" })
          }
        >
          <div
            role="group"
            aria-label="Filter open games"
            className="flex min-w-max items-center gap-2"
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
                href="/games/open"
                className="compact-control pressable inline-flex min-h-9 items-center rounded-full px-3 text-xs font-semibold text-primary hover:bg-primary-soft sm:text-[13px]"
              >
                Clear filters
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
