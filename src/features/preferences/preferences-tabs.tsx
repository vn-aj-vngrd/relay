"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

export type PreferencesSection =
  | "appearance"
  | "games"
  | "notifications"
  | "account";

const items = [
  { value: "appearance" as const, label: "Appearance" },
  { value: "games" as const, label: "Games" },
  { value: "notifications" as const, label: "Notifications" },
  { value: "account" as const, label: "Account" },
];

export function PreferencesTabs({ active }: { active: PreferencesSection }) {
  return (
    <nav aria-label="Preference sections" className="border-b border-line">
      <TabChipRail
        label="Preference sections"
        items={items}
        value={active}
        variant="underline"
        hrefFor={(item) =>
          item.value === "appearance"
            ? "/preferences"
            : `/preferences?section=${item.value}`
        }
      />
    </nav>
  );
}
