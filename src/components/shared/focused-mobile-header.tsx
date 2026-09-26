import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function FocusedMobileHeader({
  title,
  isAuthenticated,
  actionSlotId,
  backHref,
  backLabel,
  heading = false,
}: {
  title: string;
  isAuthenticated: boolean;
  actionSlotId?: string;
  backHref?: string;
  backLabel?: string;
  heading?: boolean;
}) {
  return (
    <div className="-mx-4 mb-6 flex h-14 items-center gap-1 border-b border-line px-1 sm:-mx-8 sm:px-5 lg:hidden">
      <FocusedBackLink
        isAuthenticated={isAuthenticated}
        href={backHref}
        label={backLabel}
      />
      {heading ? (
        <h1 className="text-sm font-semibold text-ink">{title}</h1>
      ) : (
        <p className="text-sm font-semibold text-ink">{title}</p>
      )}
      {actionSlotId ? (
        <div id={actionSlotId} className="ml-auto mr-3 shrink-0" />
      ) : null}
    </div>
  );
}

export function FocusedBackLink({
  isAuthenticated,
  className = "",
  href,
  label,
}: {
  isAuthenticated: boolean;
  className?: string;
  href?: string;
  label?: string;
}) {
  return (
    <Link
      href={href ?? (isAuthenticated ? "/home" : "/")}
      aria-label={label ?? (isAuthenticated ? "Back to Home" : "Back to Relay")}
      className={`back-control pressable grid size-11 shrink-0 place-items-center rounded-lg text-muted hover:text-ink ${className}`}
    >
      <ArrowLeft aria-hidden size={18} />
    </Link>
  );
}
