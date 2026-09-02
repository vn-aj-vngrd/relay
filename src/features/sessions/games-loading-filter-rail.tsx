"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

const items = [
  { value: "upcoming", label: "Upcoming" },
  { value: "invites", label: "Invites" },
  { value: "past", label: "Past" },
] as const;

export function GamesLoadingFilterRail() {
  return (
    <TabChipRail
      label="Filter games"
      items={items}
      value="upcoming"
      hrefFor={(item) => (item.value === "upcoming" ? "/games" : `/games?filter=${item.value}`)}
    />
  );
}
