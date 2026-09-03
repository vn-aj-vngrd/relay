"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

const gameSections = [
  { value: "mine" as const, label: "My games", href: "/games" },
  { value: "open" as const, label: "Open games", href: "/games/open" },
];

export function GamesSectionNav({ current }: { current: "mine" | "open" }) {
  return (
    <nav aria-label="Games sections" className="mt-2 border-b border-line">
      <TabChipRail
        label="Games sections"
        items={gameSections}
        value={current}
        variant="underline"
        hrefFor={(item) =>
          gameSections.find(({ value }) => value === item.value)?.href ??
          "/games"
        }
      />
    </nav>
  );
}
