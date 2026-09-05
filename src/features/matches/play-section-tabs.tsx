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
};

export function PlaySectionTabs({
  courts,
  queue,
  results,
  standings,
  manage,
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
      <div className="mb-7 sm:mb-8">
        <TabChipRail
          label="Live Play sections"
          items={sections}
          value={activeSection}
          onChange={setActiveSection}
        />
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
