"use client";

import { useSearchParams } from "next/navigation";
import { defaultGroupFilters, parseGroupFilters } from "./filters";
import { GroupDesktopViewControls } from "./group-collection";
import { GroupFilters } from "./group-filters";

export function GroupsLoadingFilterRail() {
  const parsed = parseGroupFilters(useSearchParams());
  return (
    <GroupFilters
      filters={parsed.success ? parsed.data : defaultGroupFilters}
      viewControls={<GroupDesktopViewControls />}
    />
  );
}
