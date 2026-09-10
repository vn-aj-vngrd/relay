"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

import {
  type BillingPageQuery,
  type BillingSection,
  billingSectionHref,
} from "./navigation";

const items = [
  { value: "current" as const, label: "My plan" },
  { value: "plans" as const, label: "Plans" },
  { value: "history" as const, label: "History" },
];

export function BillingTabs({
  active,
  query,
}: {
  active: BillingSection;
  query: BillingPageQuery;
}) {
  return (
    <nav
      aria-label="Plan and billing sections"
      className="border-b border-line"
    >
      <TabChipRail
        label="Plan and billing sections"
        items={items}
        value={active}
        variant="underline"
        hrefFor={(item) => billingSectionHref(item.value, query)}
      />
    </nav>
  );
}
