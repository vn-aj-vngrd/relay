"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

export type GameSettingsSection = "details" | "organizers";

const items = [
  { value: "details" as const, label: "Game details" },
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
          item.value === "details"
            ? `/games/${sessionId}/settings`
            : `/games/${sessionId}/settings?section=organizers`
        }
      />
    </nav>
  );
}
