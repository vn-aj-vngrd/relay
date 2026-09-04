"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

export type GameSettingsSection = "plan" | "invite" | "booking" | "organizers";

const items = [
  { value: "plan" as const, label: "Plan" },
  { value: "invite" as const, label: "Invite" },
  { value: "booking" as const, label: "Booking" },
  { value: "organizers" as const, label: "Organizers" },
];

export function GameSettingsTabs({
  sessionId,
  active,
}: {
  sessionId: string;
  active: GameSettingsSection;
}) {
  return (
    <nav aria-label="Game settings sections" className="border-b border-line">
      <TabChipRail
        label="Game settings sections"
        items={items}
        value={active}
        variant="underline"
        itemClassName="min-w-28 justify-center"
        hrefFor={(item) =>
          item.value === "plan"
            ? `/games/${sessionId}/settings`
            : `/games/${sessionId}/settings?section=${item.value}`
        }
      />
    </nav>
  );
}
