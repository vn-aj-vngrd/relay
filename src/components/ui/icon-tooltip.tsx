import type { ReactNode } from "react";

import { Tooltip } from "./tooltip";

/** Layout-preserving adapter for callers that wrap one labeled control. */
export function IconTooltip({
  label,
  children,
  id,
  align = "end",
  side = "responsive",
  disabled = false,
}: {
  label: string;
  children: ReactNode;
  id?: string;
  align?: "start" | "center" | "end";
  side?: "responsive" | "top" | "bottom" | "left" | "right";
  disabled?: boolean;
}) {
  return (
    <span className="inline-flex">
      {children}
      <Tooltip
        content={label}
        id={id}
        anchor="previous"
        align={align}
        side={side}
        disabled={disabled}
      />
    </span>
  );
}
