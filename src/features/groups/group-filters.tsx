"use client";

import { UsersThree } from "@phosphor-icons/react";
import { useRouter } from "next/navigation";
import { type ReactNode, useEffect, useRef, useState } from "react";
import { Alert } from "@/components/ui/alert";
import { SelectField } from "@/components/ui/select-field";
import { useGameResultsTransition } from "@/features/sessions/game-results-transition";
import {
  defaultGroupFilters,
  type GroupFilters as GroupFilterValues,
  groupFilterParams,
} from "./filters";

export function GroupFilters({
  filters,
  viewControls,
  error,
}: {
  filters: GroupFilterValues;
  viewControls?: ReactNode;
  error?: string;
}) {
  const router = useRouter();
  const [, startTransition] = useGameResultsTransition();
  const [search, setSearch] = useState(filters.q);
  const [previous, setPrevious] = useState(filters.q);
  const submitted = useRef(filters.q);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  if (previous !== filters.q) {
    setPrevious(filters.q);
    if (search === submitted.current) setSearch(filters.q);
  }
  useEffect(() => {
    const restore = () => {
      if (timer.current) clearTimeout(timer.current);
      const value = new URLSearchParams(window.location.search).get("q") ?? "";
      submitted.current = value;
      setSearch(value);
    };
    window.addEventListener("popstate", restore);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      window.removeEventListener("popstate", restore);
    };
  }, []);
  const update = (next: GroupFilterValues) => {
    if (timer.current) clearTimeout(timer.current);
    submitted.current = next.q;
    const query = groupFilterParams(next).toString();
    startTransition(() =>
      router.push(query ? `/groups?${query}` : "/groups", { scroll: false })
    );
  };
  return (
    <div className="mb-6 mt-6 flex min-w-0 flex-col gap-3">
      <form
        noValidate
        role="search"
        onSubmit={(event) => {
          event.preventDefault();
          update({ ...filters, q: search.trim() });
        }}
      >
        <label htmlFor="groups-search" className="sr-only">
          Search your groups
        </label>
        <input
          id="groups-search"
          type="search"
          maxLength={200}
          placeholder="Search your groups…"
          value={search}
          className="h-11 w-full rounded-lg border border-line bg-surface px-3 text-[15px] placeholder:text-muted focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/15"
          onChange={(event) => {
            const q = event.target.value;
            setSearch(q);
            if (timer.current) clearTimeout(timer.current);
            timer.current = setTimeout(
              () => update({ ...filters, q: q.trim() }),
              300
            );
          }}
        />
      </form>
      <div className="flex items-start gap-3">
        <div
          role="group"
          aria-label="Filter groups"
          className="flex min-w-0 flex-1 flex-wrap items-center gap-2"
        >
          <SelectField
            id="groups-role"
            label="Your role"
            hideLabel
            density="compact"
            leadingIcon={<UsersThree aria-hidden size={14} />}
            value={filters.role}
            onValueChange={(role) =>
              update({
                q: search.trim(),
                role: role as GroupFilterValues["role"],
              })
            }
            options={[
              { value: "any", label: "Any role" },
              { value: "owner", label: "Owner" },
              { value: "member", label: "Member" },
            ]}
            className="compact-control mt-0 h-9 min-h-9 !w-auto !rounded-full px-3 text-xs font-semibold sm:text-[13px]"
          />
          {search || filters.q || filters.role !== "any" || error ? (
            <button
              type="button"
              className="compact-control pressable inline-flex h-9 min-h-9 items-center justify-center rounded-full px-2.5 text-xs font-semibold text-primary hover:bg-primary-soft sm:px-3 sm:text-[13px]"
              onClick={() => {
                setSearch("");
                update(defaultGroupFilters);
              }}
            >
              Clear filters
            </button>
          ) : null}
        </div>
        <span className="hidden shrink-0 sm:block">{viewControls}</span>
      </div>
      {error ? <Alert>{error}</Alert> : null}
    </div>
  );
}
