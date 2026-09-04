"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

export type SettingsSection =
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

export function SettingsTabs({ active }: { active: SettingsSection }) {
  return (
    <nav aria-label="Settings sections" className="border-b border-line">
      <TabChipRail
        label="Settings sections"
        items={items}
        value={active}
        variant="underline"
        hrefFor={(item) =>
          item.value === "account"
            ? "/settings"
            : `/settings?section=${item.value}`
        }
      />
    </nav>
  );
}
