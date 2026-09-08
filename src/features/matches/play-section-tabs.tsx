"use client";

import { type ReactNode, useState } from "react";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

type PlaySection = "courts" | "queue" | "results" | "standings" | "manage";

type PlaySectionTabsProps = {
  courts: ReactNode;
  queue: ReactNode;
  results?: ReactNode;
  standings?: ReactNode;
  manage?: ReactNode;
  headerActions?: ReactNode;
};

export function PlaySectionTabs({
  courts,
  queue,
  results,
  standings,
  manage,
  headerActions,
}: PlaySectionTabsProps) {
  const [activeSection, setActiveSection] = useState<PlaySection>("courts");
  const sections = [
    { value: "courts" as const, label: "Courts", content: courts },
    { value: "queue" as const, label: "Queue", content: queue },
    ...(results
      ? [{ value: "results" as const, label: "Results", content: results }]
      : []),
    ...(standings
      ? [
          {
            value: "standings" as const,
            label: "Standings",
            content: standings,
          },
        ]
      : []),
    ...(manage
      ? [{ value: "manage" as const, label: "Manage", content: manage }]
      : []),
  ];

  return (
    <div>
      <div className="mb-7 flex min-w-0 flex-col gap-4 sm:mb-8 md:flex-row md:items-center md:justify-between">
        {headerActions ? (
          <div className="md:order-2 md:shrink-0">{headerActions}</div>
        ) : null}
        <div className="min-w-0 md:order-1 md:flex-1">
          <TabChipRail
            label="Live Play sections"
            items={sections}
            value={activeSection}
            onChange={setActiveSection}
          />
        </div>
      </div>
      {sections.map((section) => (
        <div
          key={section.value}
          role="region"
          aria-label={`${section.label} live Play section`}
          hidden={activeSection !== section.value}
        >
          {section.content}
        </div>
      ))}
    </div>
  );
}
