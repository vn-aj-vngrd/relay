"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

import { SESSION_TABS, type SessionTabLabel } from "./session-tabs";

export function ResponsiveSessionTabs({
  hrefBase,
  active,
  padded = true,
}: {
  hrefBase: string;
  active: SessionTabLabel | null;
  padded?: boolean;
}) {
  const items = SESSION_TABS.map((tab) => ({ value: tab.label, label: tab.label }));

  return (
    <div className={`${padded ? "px-4 sm:px-8 lg:px-0" : ""} py-2`}>
      <TabChipRail
        label="Game navigation"
        items={items}
        value={active}
        hrefFor={(item) => {
          const tab = SESSION_TABS.find(({ label }) => label === item.value);
          return `${hrefBase}${tab?.path ?? ""}`;
        }}
      />
    </div>
  );
}
