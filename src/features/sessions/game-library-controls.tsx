"use client";

import { CalendarBlank, Users } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { DatePickerField } from "@/components/ui/date-time-picker";
import { SelectField } from "@/components/ui/select-field";
import {
  defaultGameLibraryFilters,
  type GameLibraryFilters,
  type GameLibraryOptions,
  gameLibraryFilterKeys,
  gameLibraryRangeError,
} from "./game-library-filters";
import { useGameResultsTransition } from "./game-results-transition";
import { GameDesktopViewControls } from "./game-view-menu";

const whenOptions = [
  { value: "upcoming", label: "Upcoming" },
  { value: "past", label: "Past" },
  { value: "all", label: "All dates" },
  { value: "range", label: "Date range" },
];
const responseOptions = [
  { value: "invited", label: "Needs response" },
  { value: "going", label: "Going" },
  { value: "maybe", label: "Maybe" },
  { value: "declined", label: "Can’t go" },
  { value: "pending", label: "Awaiting approval" },
  { value: "waitlisted", label: "Waitlisted" },
  { value: "any", label: "All responses" },
];

const roleOptions = [
  { value: "any", label: "Any role" },
  { value: "player", label: "Player" },
  { value: "host", label: "Host" },
  { value: "cohost", label: "Co-host" },
];

export function GameLibraryControls({
  filters,
  error,
}: {
  filters: GameLibraryFilters;
  options?: GameLibraryOptions;
  error?: string;
  loadingOptions?: boolean;
}) {
  const router = useRouter();
  const invitations = filters.collection === "invitations";
  const defaults: GameLibraryFilters = invitations
    ? {
        ...defaultGameLibraryFilters,
        collection: "invitations",
        response: "invited",
        cancelled: "true",
      }
    : defaultGameLibraryFilters;
  const destination = invitations ? "/games/invitations" : "/games";
  const [pending, startTransition] = useGameResultsTransition();
  const [search, setSearch] = useState(filters.q);
  const [previousSearch, setPreviousSearch] = useState(filters.q);
  const submittedSearch = useRef(filters.q);
  const pendingParams = useRef<{ base: string; query: string } | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (previousSearch !== filters.q) {
    setPreviousSearch(filters.q);
    if (search === submittedSearch.current) setSearch(filters.q);
  }
  useEffect(() => {
    const restoreSearch = () => {
      if (timer.current) clearTimeout(timer.current);
      pendingParams.current = null;
      const value = new URLSearchParams(window.location.search).get("q") ?? "";
      submittedSearch.current = value;
      setSearch(value);
    };
    window.addEventListener("popstate", restoreSearch);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("popstate", restoreSearch);
    };
  }, []);
  const update = (values: Partial<GameLibraryFilters>, clear = false) => {
    if (timer.current) clearTimeout(timer.current);
    const base = window.location.search;
    const params = new URLSearchParams(
      pendingParams.current?.base === base ? pendingParams.current.query : base
    );
    if (values.q !== undefined || clear)
      submittedSearch.current = clear ? "" : values.q!;
    params.delete("filter");
    params.delete("cursor");
    if (clear) for (const key of gameLibraryFilterKeys) params.delete(key);
    for (const [key, value] of Object.entries(values)) {
      if (value === defaults[key as keyof GameLibraryFilters])
        params.delete(key);
      else params.set(key, value);
    }
    if (values.when && values.when !== "range") {
      params.delete("from");
      params.delete("until");
    }
    pendingParams.current = { base, query: params.toString() };
    startTransition(() =>
      router.push(`${destination}${params.size ? `?${params}` : ""}`, {
        scroll: false,
      })
    );
  };
  const select = (
    key: "when" | "role" | "response",
    label: string,
    choices: { value: string; label: string }[]
  ) => (
    <SelectField
      id={`games-${key}`}
      label={label}
      hideLabel
      density="compact"
      leadingIcon={
        key === "when" ? (
          <CalendarBlank aria-hidden size={14} />
        ) : (
          <Users aria-hidden size={14} />
        )
      }
      value={filters[key]}
      onValueChange={(value) => update({ [key]: value })}
      options={choices}
      className="compact-control mt-0 h-9 min-h-9 !w-auto !rounded-full px-3 text-xs font-semibold sm:text-[13px]"
    />
  );
  const active = gameLibraryFilterKeys.filter(
    (key) => filters[key] !== defaults[key] && key !== "from" && key !== "until"
  );
  const rangeError = gameLibraryRangeError(filters);
  return (
    <div className="mb-6 mt-6 flex min-w-0 flex-col gap-3" aria-busy={pending}>
      <form
        noValidate
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update({ q: search });
        }}
      >
        <label htmlFor="games-search" className="sr-only">
          {invitations ? "Search invitations" : "Search your games"}
        </label>
        <div className="relative">
          <input
            id="games-search"
            type="search"
            maxLength={200}
            placeholder={
              invitations
                ? "Search an invitation, venue, or host…"
                : "Search a game, venue, or host…"
            }
            value={search}
            className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
            onChange={(event) => {
              const value = event.target.value;
              setSearch(value);
              if (timer.current) clearTimeout(timer.current);
              timer.current = setTimeout(() => update({ q: value }), 300);
            }}
          />
        </div>
      </form>
      <div className="flex items-start gap-3">
        <div
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
          role="group"
          aria-label="Filter your games"
        >
          {invitations ? select("response", "Response", responseOptions) : null}
          {select("when", "When", whenOptions)}
          {!invitations ? select("role", "Your role", roleOptions) : null}
          {active.length || search || error ? (
            <button
              type="button"
              className="compact-control pressable inline-flex h-9 min-h-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold text-primary hover:bg-primary-soft sm:px-3 sm:text-[13px]"
              onClick={() => {
                setSearch("");
                update({}, true);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <span className="hidden shrink-0 sm:block">
          <GameDesktopViewControls />
        </span>
      </div>
      {filters.when === "range" ? (
        <fieldset className="flex flex-wrap gap-2">
          <legend className="mb-2 text-sm font-semibold">Date range</legend>
          <DatePickerField
            id="games-from"
            name="from"
            label="From date"
            density="compact"
            value={filters.from}
            onValueChange={(from) => update({ from })}
          />
          <DatePickerField
            id="games-until"
            name="until"
            label="Until date"
            density="compact"
            value={filters.until}
            minValue={filters.from || undefined}
            onValueChange={(until) => update({ until })}
          />
          <p className="w-full text-xs text-muted">
            Both dates included, using each game’s local date.
          </p>
        </fieldset>
      ) : null}
      {error || rangeError ? <Alert>{error || rangeError}</Alert> : null}
    </div>
  );
}
