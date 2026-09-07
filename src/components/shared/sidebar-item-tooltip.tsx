import type { ReactNode } from "react";

import { Tooltip } from "@/components/ui/tooltip";

/** Keep inside the sidebar control so its geometry and focus target stay intact. */
export function SidebarItemTooltip({ children }: { children: ReactNode }) {
  return (
    <Tooltip content={children} side="right" align="start" compactSidebarOnly />
  );
}
