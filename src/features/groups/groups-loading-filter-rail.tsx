"use client";

import { useState } from "react";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

const items = [
  { value: "all", label: "All" },
  { value: "organizing", label: "Organizing" },
  { value: "joined", label: "Joined" },
] as const;

type GroupFilter = (typeof items)[number]["value"];

export function GroupsLoadingFilterRail() {
  const [filter, setFilter] = useState<GroupFilter>("all");
  return <TabChipRail label="Filter groups" items={items} value={filter} onChange={setFilter} className="min-w-0" />;
}
