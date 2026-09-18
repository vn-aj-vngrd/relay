import type { ReactNode } from "react";

const tones = {
  primary: "bg-primary-soft text-primary",
  warning: "bg-warning/12 text-warning",
  danger: "bg-danger/10 text-danger",
  success: "bg-success/12 text-success",
};

export type ConfirmationIconTone = keyof typeof tones;

export function ConfirmationIcon({
  children,
  tone = "primary",
}: {
  children: ReactNode;
  tone?: ConfirmationIconTone;
}) {
  return (
    <span
      aria-hidden="true"
      className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
