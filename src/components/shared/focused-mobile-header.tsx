import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

export function FocusedMobileHeader({
  title,
  isAuthenticated,
}: {
  title: string;
  isAuthenticated: boolean;
}) {
  return (
    <div className="-mx-4 mb-6 flex h-14 items-center gap-1 border-b border-line px-1 sm:-mx-8 sm:px-5 lg:hidden">
      <Link
        href={isAuthenticated ? "/home" : "/"}
        aria-label={isAuthenticated ? "Back to Home" : "Back to Relay"}
        className="pressable grid size-11 place-items-center rounded-lg text-muted hover:bg-surface-strong hover:text-ink"
      >
        <ArrowLeft aria-hidden size={18} />
      </Link>
      <p className="text-sm font-semibold text-ink">{title}</p>
    </div>
  );
}
