import Link from "next/link";

import { Button } from "@/components/ui/button";
import { SelectField } from "@/components/ui/select-field";

import { openGameDateFilters, type OpenGamesFilters } from "./open-games";

const dateLabels = { any: "Any upcoming date", today: "Today", "7d": "Next 7 days", "30d": "Next 30 days" };

export function OpenGamesFilters({ filters }: { filters: OpenGamesFilters }) {
  const hasFilters = Boolean(filters.location || filters.date !== "any" || filters.available);

  return (
    <form action="/games/open" method="get" className="mt-6">
      <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_minmax(12rem,.65fr)] lg:grid-cols-[minmax(0,1fr)_14rem_auto] lg:items-end">
        <div>
          <label htmlFor="open-location" className="block text-sm font-semibold">
            Court or location
          </label>
          <input
            id="open-location"
            name="location"
            defaultValue={filters.location}
            maxLength={80}
            placeholder="Search a court, city, or neighborhood…"
            className="mt-1.5 h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          />
        </div>
        <SelectField
          id="open-date"
          name="date"
          label="Date"
          defaultValue={filters.date}
          options={openGameDateFilters.map((value) => ({ value, label: dateLabels[value] }))}
        />
        <Button type="submit" className="min-h-11 w-full lg:min-h-9 lg:w-auto">
          Apply filters
        </Button>
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <label className="flex min-h-11 cursor-pointer items-center gap-2 text-sm font-medium">
          <input
            type="checkbox"
            name="available"
            value="1"
            defaultChecked={filters.available}
            className="h-5 w-5 accent-[var(--primary)]"
          />
          Games with spots available
        </label>
        {hasFilters ? (
          <Link href="/games/open" className="inline-flex min-h-9 items-center text-sm font-semibold text-primary">
            Clear filters
          </Link>
        ) : null}
      </div>
    </form>
  );
}
