import type { ReactNode } from "react";

export function IconTooltip({ label, children, id }: { label: string; children: ReactNode; id?: string }) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        id={id}
        role="tooltip"
        className="pointer-events-none absolute bottom-full right-0 z-40 mb-2 hidden w-max max-w-56 rounded-md bg-ink px-2.5 py-1.5 text-left text-xs font-medium leading-5 text-surface group-hover/tooltip:block group-focus-within/tooltip:block"
      >
        {label}
      </span>
    </span>
  );
}
