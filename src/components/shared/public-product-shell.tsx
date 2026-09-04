import { SignIn, UserPlus } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { Brand } from "./brand";
import { PublicProductNav } from "./public-product-nav";
import { SidebarCollapseToggle } from "./sidebar-collapse-toggle";

export function PublicProductShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="app-shell flex h-dvh flex-col overflow-hidden bg-canvas lg:block">
      <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-canvas px-3 py-3 lg:flex">
        <div className="sidebar-header mb-3 flex h-11 items-center justify-between gap-2 border-b border-line px-1 pb-3">
          <span className="sidebar-brand">
            <Brand />
          </span>
          <SidebarCollapseToggle />
        </div>
        <PublicProductNav mode="sidebar" />
        <div className="public-sidebar-auth mt-auto border-t border-line pt-3">
          <div className="public-sidebar-auth-expanded">
            <p className="px-2 text-xs leading-5 text-muted">
              Sign in to save games, invite players, and keep scores.
            </p>
            <div className="mt-3 grid grid-cols-2 gap-2">
              <Link
                href="/login"
                className="pressable inline-flex min-h-9 items-center justify-center rounded-lg border border-line bg-surface text-[13px] font-semibold hover:bg-surface-strong"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="pressable inline-flex min-h-9 items-center justify-center rounded-lg bg-primary text-[13px] font-semibold text-white hover:bg-primary-hover"
              >
                Sign up
              </Link>
            </div>
          </div>
          <nav
            aria-label="Account access"
            className="public-sidebar-auth-compact flex-col items-center gap-1"
          >
            <Link
              href="/login"
              aria-label="Log in to Relay"
              className="sidebar-nav-item pressable group relative grid h-10 w-10 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
            >
              <SignIn aria-hidden size={19} />
              <span role="tooltip" className="sidebar-item-tooltip">
                Log in
              </span>
            </Link>
            <Link
              href="/signup"
              aria-label="Create a Relay account"
              className="sidebar-nav-item pressable group relative grid h-10 w-10 place-items-center rounded-md bg-primary text-white hover:bg-primary-hover"
            >
              <UserPlus aria-hidden size={19} />
              <span role="tooltip" className="sidebar-item-tooltip">
                Create account
              </span>
            </Link>
          </nav>
        </div>
      </aside>

      <header className="app-mobile-header app-chrome z-20 shrink-0 border-b border-line lg:hidden">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Brand />
          <Link
            href="/login"
            className="pressable inline-flex min-h-10 items-center px-3 text-sm font-semibold text-primary"
          >
            Log in
          </Link>
        </div>
      </header>

      <div className="app-workspace-frame min-h-0 flex-1 overflow-hidden lg:h-dvh lg:py-2 lg:pl-[240px] lg:pr-2">
        <div className="app-scroll-surface h-full overflow-y-auto overscroll-y-contain bg-surface lg:rounded-xl lg:border lg:border-line">
          <main
            id="main-content"
            className="app-content mx-auto flex w-full max-w-6xl flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10"
          >
            <div className="min-h-0 flex-1">{children}</div>
          </main>
        </div>
      </div>
      <PublicProductNav mode="mobile" />
    </div>
  );
}
