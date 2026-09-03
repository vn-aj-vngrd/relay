"use client";

import { ResponsiveSessionTabs } from "./responsive-session-tabs";
import type { SessionTabLabel } from "./session-tabs";

export function SessionNav({
  id,
  active = "Overview",
  embedded = false,
  hrefBase,
  padded = true,
}: {
  id: string;
  active?: SessionTabLabel | null;
  embedded?: boolean;
  hrefBase?: string;
  padded?: boolean;
}) {
  return (
    <nav
      aria-label="Game navigation"
      className={
        embedded ? "min-w-0 flex-1 basis-full sm:basis-auto" : "-mx-4 border-b border-line px-2 sm:-mx-6 sm:px-6"
      }
    >
      <ResponsiveSessionTabs hrefBase={hrefBase ?? `/games/${id}`} active={active} padded={padded} />
    </nav>
  );
}
