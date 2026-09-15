import type { IconProps } from "@phosphor-icons/react";

/** Agent's rounded cursor and pickleball perforations, shared by every surface. */
export function AgentMark({ size = 24, className }: IconProps) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 48 48"
      fill="none"
      className={`shrink-0 ${className ?? ""}`}
    >
      <path
        d="M10 4C6 3.5 3.5 6 4 10C5.5 22 11 37 16 43C18.5 46 22 45 23.5 41L28 28L41 23.5C45 22 46 18.5 43 16C37 11 22 5.5 10 4Z"
        fill="#C7E88A"
        stroke="#426526"
        strokeWidth="3.2"
        strokeLinejoin="round"
      />
      <g fill="#426526">
        <circle cx="14" cy="14" r="2.2" />
        <circle cx="24" cy="17" r="2.2" />
        <circle cx="17" cy="24" r="2.2" />
      </g>
    </svg>
  );
}
