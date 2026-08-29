import type { ReactNode } from "react";

export function IconTooltip({
  label,
  children,
  id,
  align = "end",
}: {
  label: string;
  children: ReactNode;
  id?: string;
  align?: "start" | "center" | "end";
}) {
  const alignment = align === "center" ? "left-1/2 -translate-x-1/2" : align === "start" ? "left-0" : "right-0";

  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        id={id}
        role="tooltip"
        className={`relay-tooltip pointer-events-none absolute top-full z-50 mt-2 hidden w-max max-w-[min(14rem,calc(100vw-2rem))] rounded-md px-2.5 py-1.5 text-left text-xs font-medium leading-5 group-hover/tooltip:block group-focus-within/tooltip:block sm:bottom-full sm:top-auto sm:mb-2 sm:mt-0 ${alignment}`}
      >
        {label}
      </span>
    </span>
  );
}
