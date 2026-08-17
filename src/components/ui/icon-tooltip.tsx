import type { ReactNode } from "react";

export function IconTooltip({ label, children }: { label: string; children: ReactNode }) {
  return <span className="group/tooltip relative inline-flex">
    {children}
    <span role="tooltip" className="pointer-events-none absolute bottom-full right-0 z-40 mb-2 hidden whitespace-nowrap rounded-md bg-ink px-2 py-1 text-xs font-medium text-surface group-hover/tooltip:block group-focus-within/tooltip:block">{label}</span>
  </span>;
}
