import { Bell, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import { and, eq, isNull } from "drizzle-orm";
import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AppBreadcrumbs } from "@/components/shared/app-breadcrumbs";
import { AppNav } from "@/components/shared/app-nav";
import { Avatar } from "@/components/shared/avatar-stack";
import { Brand } from "@/components/shared/brand";
import { SidebarAccount } from "@/components/shared/sidebar-account";
import { SidebarCollapseToggle } from "@/components/shared/sidebar-collapse-toggle";
import { SidebarSupportNav } from "@/components/shared/sidebar-support-nav";
import { SidebarUtilityNav } from "@/components/shared/sidebar-utility-nav";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { isAdminEmail } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { NotificationRealtimeRefresh } from "@/features/notifications/realtime-refresh";
import { ApplicationTour } from "@/features/onboarding/application-tour";
import { profileAvatarUrl } from "@/features/players/avatar";
import { ensureProfile } from "@/features/players/profile";
import { getInvitationCount } from "@/features/sessions/queries";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [profile, unreadCount, invitationCount] = await Promise.all([
    ensureProfile(user),
    db.$count(notifications, and(eq(notifications.userId, user.id), isNull(notifications.readAt))),
    getInvitationCount(user.id),
  ]);
  if (!profile.onboardingCompletedAt) redirect("/onboarding");
  const isAdmin = isAdminEmail(user.email);

  return (
    <div className="app-shell flex h-dvh flex-col overflow-hidden bg-canvas lg:block">
      <NotificationRealtimeRefresh userId={user.id} />
      <Suspense fallback={null}>
        <ApplicationTour required={!profile.productTourCompletedAt} />
      </Suspense>
      <aside className="app-sidebar fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-canvas px-3 py-3 lg:flex">
        <div className="sidebar-header mb-3 flex h-11 items-center justify-between gap-2 border-b border-line px-1 pb-3">
          <span className="sidebar-brand">
            <Brand href="/home" />
          </span>
          <SidebarCollapseToggle />
        </div>
        <SidebarUtilityNav />
        <AppNav mode="sidebar" invitationCount={invitationCount} />
        <div className="mt-auto">
          <SidebarSupportNav unreadCount={unreadCount} isAdmin={isAdmin} />
          <div className="mt-1 border-t border-line pt-1">
            <SidebarAccount
              name={profile.name}
              username={profile.username}
              avatarUrl={profileAvatarUrl(profile.avatarPath)}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </aside>

      <header className="app-mobile-header app-chrome z-20 shrink-0 border-b border-line lg:hidden">
        <div className="flex h-14 items-center justify-between px-4 sm:px-6">
          <Brand href="/home" />
          <div className="flex items-center">
            <Link
              href="/search"
              data-tour="search"
              prefetch={false}
              aria-label="Search"
              className="pressable grid h-11 w-11 place-items-center text-muted hover:text-ink"
            >
              <MagnifyingGlass aria-hidden size={20} />
            </Link>
            <Link
              href="/notifications"
              data-tour="notifications"
              prefetch={false}
              aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"}
              className="pressable relative grid h-11 w-11 place-items-center text-muted hover:text-ink"
            >
              <Bell aria-hidden size={20} />
              {unreadCount ? (
                <span className="score absolute right-0 top-0 inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-white ring-2 ring-surface">
                  {unreadCount > 99 ? "99+" : unreadCount}
                </span>
              ) : null}
            </Link>
            <span className="ml-1">
              <Link
                href={`/profile/${profile.username}`}
                data-tour="profile"
                prefetch={false}
                aria-label={`Open ${profile.name}'s profile`}
                className="pressable grid h-11 w-11 place-items-center rounded-full"
              >
                <Avatar name={profile.name} imageUrl={profileAvatarUrl(profile.avatarPath)} size="sm" />
              </Link>
            </span>
          </div>
        </div>
      </header>

      <div className="app-workspace-frame min-h-0 flex-1 overflow-hidden lg:h-dvh lg:py-2 lg:pl-[240px] lg:pr-2">
        <div className="app-scroll-surface h-full overflow-y-auto overscroll-y-contain bg-surface lg:rounded-xl lg:border lg:border-line">
          <main
            id="main-content"
            data-tour="workspace"
            className="app-content mx-auto flex w-full max-w-6xl flex-col px-4 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-6 sm:px-8 sm:pt-8 lg:px-10 lg:pb-16 lg:pt-10"
          >
            <AppBreadcrumbs />
            <div className="min-h-0 flex-1">{children}</div>
          </main>
        </div>
      </div>
      <AppNav mode="mobile" invitationCount={invitationCount} />
    </div>
  );
}
