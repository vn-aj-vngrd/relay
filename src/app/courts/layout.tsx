import Link from "next/link";

import { Brand } from "@/components/shared/brand";
import { getCurrentUser } from "@/features/auth/session";

export default async function CourtLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  return (
    <div className="min-h-dvh bg-canvas">
      <header className="app-chrome sticky top-0 z-40 border-b border-line">
        <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between gap-4 px-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-1 sm:gap-2">
            {user ? null : (
              <Link
                href="/login?next=/courts"
                className="pressable hidden min-h-10 items-center px-3 text-sm font-medium text-muted hover:text-ink sm:inline-flex"
              >
                Log in
              </Link>
            )}
            <Link
              href={user ? "/home" : "/signup"}
              className="pressable inline-flex min-h-10 items-center justify-center rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
            >
              {user ? "Open Relay" : "Create a game"}
            </Link>
          </div>
        </div>
      </header>
      <main id="main-content" className="mx-auto w-full max-w-[1180px] px-4 pb-16 pt-8 sm:px-8 sm:pt-10">
        {children}
      </main>
      <footer className="border-t border-line px-4 py-7 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <Brand />
          <nav aria-label="Court Finder footer" className="flex items-center gap-5">
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
