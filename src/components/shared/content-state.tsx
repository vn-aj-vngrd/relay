import {
  Bell,
  CalendarBlank,
  ChartBar,
  ChatCircle,
  CircleNotch,
  ClipboardText,
  ImageSquare,
  MagnifyingGlass,
  MapPin,
  Receipt,
  Tray,
  Users,
} from "@phosphor-icons/react/ssr";
import type { ReactNode } from "react";

const stateIcons = {
  calendar: CalendarBlank,
  chat: ChatCircle,
  feedback: ClipboardText,
  inbox: Tray,
  notifications: Bell,
  payments: Receipt,
  photos: ImageSquare,
  players: Users,
  results: ChartBar,
  search: MagnifyingGlass,
  venues: MapPin,
};

export function EmptyState({
  icon = "inbox",
  title,
  description,
  children,
  compact = false,
  className = "",
}: {
  icon?: keyof typeof stateIcons;
  title: ReactNode;
  description?: ReactNode;
  children?: ReactNode;
  compact?: boolean;
  className?: string;
}) {
  const Icon = stateIcons[icon];
  return (
    <div
      className={`flex min-w-0 flex-col items-center text-center ${compact ? "px-3 py-6" : "px-4 py-10 sm:py-12"} ${className}`}
    >
      <Icon
        aria-hidden="true"
        size={compact ? 24 : 32}
        weight="regular"
        className="mb-3 shrink-0 text-muted"
      />
      <h2
        className={`max-w-md break-words font-semibold text-ink ${compact ? "text-sm" : "text-base sm:text-lg"}`}
      >
        {title}
      </h2>
      {description ? (
        <p className="mt-2 max-w-md break-words text-sm leading-6 text-muted">
          {description}
        </p>
      ) : null}
      {children ? (
        <div className="mt-4 flex max-w-full flex-wrap items-center justify-center gap-2">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function LoadingState({
  label,
  description,
  compact = false,
  announce = true,
  className = "",
}: {
  label: string;
  description?: string;
  compact?: boolean;
  announce?: boolean;
  className?: string;
}) {
  return (
    <div
      role={announce ? "status" : undefined}
      className={`flex min-w-0 items-center justify-center text-center ${compact ? "gap-2 py-3" : "flex-col px-4 py-10 sm:py-12"} ${className}`}
    >
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 animate-spin text-primary motion-reduce:animate-none ${compact ? "" : "mb-3"}`}
      >
        <CircleNotch size={compact ? 18 : 28} />
      </span>
      <div className="min-w-0">
        <p className="text-sm font-semibold text-ink">{label}</p>
        {description ? (
          <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted">
            {description}
          </p>
        ) : null}
      </div>
    </div>
  );
}
