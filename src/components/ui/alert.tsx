import {
  CheckCircle,
  Info,
  WarningCircle,
} from "@phosphor-icons/react/dist/ssr";
import type { ReactNode } from "react";

type AlertVariant = "danger" | "info" | "success";

const styles: Record<AlertVariant, string> = {
  danger: "bg-danger/8 text-danger ring-danger/15",
  info: "bg-primary-soft text-primary ring-primary/15",
  success: "bg-success/8 text-success ring-success/15",
};

const icons = {
  danger: WarningCircle,
  info: Info,
  success: CheckCircle,
};

export function Alert({
  children,
  variant = "danger",
  className = "",
}: {
  children: ReactNode;
  variant?: AlertVariant;
  className?: string;
}) {
  const Icon = icons[variant];
  return (
    <div
      role={variant === "danger" ? "alert" : "status"}
      className={`flex items-start gap-2.5 rounded-lg px-3.5 py-3 text-sm font-medium leading-5 ring-1 ${styles[variant]} ${className}`}
    >
      <Icon aria-hidden size={18} weight="fill" className="mt-0.5 shrink-0" />
      <div className="min-w-0">{children}</div>
    </div>
  );
}
