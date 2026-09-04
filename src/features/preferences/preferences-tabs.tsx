"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

export type PreferencesSection =
  | "appearance"
  | "games"
  | "notifications"
  | "account";

const items = [
  { value: "account" as const, label: "Account" },
  { value: "notifications" as const, label: "Notifications" },
  { value: "games" as const, label: "Games" },
  { value: "appearance" as const, label: "Appearance" },
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
          item.value === "account"
            ? "/preferences"
            : `/preferences?section=${item.value}`
        }
      />
    </nav>
  );
}
