import type { ComponentProps } from "react";

/** Native checkbox submission with on/off switch semantics. Label at the call site. */
export function Switch({
  className = "",
  ...props
}: Omit<ComponentProps<"input">, "type" | "role">) {
  return (
    <span className={`relative inline-flex h-6 w-10 shrink-0 ${className}`}>
      <input
        {...props}
        type="checkbox"
        role="switch"
        aria-checked={props.checked}
        className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0 disabled:cursor-not-allowed"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none h-6 w-10 rounded-full bg-line transition-colors peer-checked:bg-primary peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-primary peer-disabled:opacity-45 motion-reduce:transition-none"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute left-1 top-1 size-4 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4 peer-disabled:opacity-45 motion-reduce:transition-none"
      />
    </span>
  );
}
