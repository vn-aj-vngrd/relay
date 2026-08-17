import { Bell, Lifebuoy, MagnifyingGlass, ShieldCheck } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { redirect } from "next/navigation";
import { and, eq, isNull } from "drizzle-orm";
import { AppNav } from "@/components/shared/app-nav";
import { Brand } from "@/components/shared/brand";
import { SidebarAccount } from "@/components/shared/sidebar-account";
import { SidebarUtilityNav } from "@/components/shared/sidebar-utility-nav";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { isAdminEmail } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { profileAvatarUrl } from "@/features/players/avatar";
import { ensureProfile } from "@/features/players/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  if (!profile.onboardingCompletedAt) redirect("/onboarding");
  if (!profile.productTourCompletedAt) redirect("/onboarding/tour");
  const unreadCount = await db.$count(notifications, and(eq(notifications.userId, user.id), isNull(notifications.readAt)));
  const isAdmin = isAdminEmail(user.email);

  return <div className="flex h-dvh flex-col overflow-hidden bg-canvas lg:block">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-canvas px-3 py-3 lg:flex">
      <div className="mb-3 border-b border-line px-1 pb-3"><Brand href="/home" /></div>
      <SidebarUtilityNav />
      <AppNav username={profile.username} mode="sidebar" />
      <div className="mt-auto space-y-1"><Link href="/notifications" prefetch={false} className="sidebar-row pressable relative flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium text-muted hover:bg-surface-strong/70 hover:text-ink"><Bell aria-hidden size={18} />Notifications{unreadCount ? <span className="ml-auto h-1.5 w-1.5 rounded-full bg-live" aria-label={`${unreadCount} unread`} /> : null}</Link><Link href="/help" prefetch={false} className="sidebar-row pressable flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium text-muted hover:bg-surface-strong/70 hover:text-ink"><Lifebuoy aria-hidden size={18} />Help Center</Link>{isAdmin ? <Link href="/admin" prefetch={false} className="sidebar-row pressable flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium text-muted hover:bg-surface-strong/70 hover:text-ink"><ShieldCheck aria-hidden size={18} />Admin console</Link> : null}<div className="border-t border-line pt-1"><SidebarAccount name={profile.name} username={profile.username} avatarUrl={profileAvatarUrl(profile.avatarPath)} isAdmin={isAdmin} /></div></div>
    </aside>

    <header className="app-chrome z-20 shrink-0 border-b border-line lg:hidden"><div className="flex h-[56px] items-center justify-between px-4 sm:px-6"><Brand href="/home" /><div className="flex items-center"><Link href="/search" prefetch={false} aria-label="Search" className="pressable grid h-10 w-10 place-items-center text-muted hover:text-ink"><MagnifyingGlass aria-hidden size={20} /></Link><Link href="/notifications" prefetch={false} aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} className="pressable relative grid h-10 w-10 place-items-center text-muted hover:text-ink"><Bell aria-hidden size={20} />{unreadCount ? <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-live ring-2 ring-surface" /> : null}</Link></div></div></header>

    <div className="min-h-0 flex-1 overflow-hidden lg:h-dvh lg:py-2 lg:pl-[240px] lg:pr-2"><div className="h-full overflow-y-auto overscroll-y-contain bg-surface lg:rounded-xl lg:border lg:border-line"><main id="main-content" className="app-content mx-auto max-w-[1120px] px-4 pb-32 pt-7 sm:px-8 sm:pt-9 lg:px-10 lg:pb-16 lg:pt-10">{children}</main></div></div>
    <AppNav username={profile.username} mode="mobile" />
  </div>;
}
