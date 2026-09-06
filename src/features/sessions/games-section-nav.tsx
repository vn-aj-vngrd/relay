"use client";

import { TabChipRail } from "@/components/ui/tab-chip-rail";

const gameSections = [
  { value: "mine" as const, label: "My games", href: "/games" },
  {
    value: "invitations" as const,
    label: "Invitations",
    href: "/games/invitations",
  },
  { value: "open" as const, label: "Open games", href: "/games/open" },
];

export function GamesSectionNav({
  current,
  invitationCount = 0,
}: {
  current: "mine" | "invitations" | "open";
  invitationCount?: number;
}) {
  return (
    <nav aria-label="Games sections" className="mt-2 border-b border-line">
      <TabChipRail
        label="Games sections"
        items={gameSections.map((item) => ({
          ...item,
          label:
            item.value === "invitations" && invitationCount > 0
              ? `Invitations (${invitationCount})`
              : item.label,
        }))}
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
