import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { AppNav } from "@/components/shared/app-nav";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [profile, unreadCount] = await Promise.all([ensureProfile(user), db.$count(notifications, and(eq(notifications.userId, user.id), isNull(notifications.readAt)))]);

  return <div className="min-h-screen bg-canvas">
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-60 flex-col border-r border-line bg-surface p-4 lg:flex">
      <div className="px-2 pb-8 pt-1"><Brand /></div>
      <AppNav username={profile.username} mode="sidebar" />
      <div className="mt-auto space-y-1 border-t border-line pt-4">
        <Link href="/search" className="pressable flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-[620] text-muted hover:bg-surface-strong hover:text-ink"><Search aria-hidden size={20} />Search</Link>
        <Link href="/notifications" className="pressable relative flex min-h-12 items-center gap-3 rounded-xl px-3 text-sm font-[620] text-muted hover:bg-surface-strong hover:text-ink"><Bell aria-hidden size={20} />Notifications{unreadCount ? <span className="ml-auto h-2 w-2 rounded-full bg-live" aria-label={`${unreadCount} unread`} /> : null}</Link>
        <ThemeToggle showLabel />
      </div>
    </aside>

    <header className="app-chrome sticky top-0 z-20 border-b border-line lg:hidden">
      <div className="flex h-[60px] items-center justify-between px-4 sm:h-16 sm:px-6">
        <Brand />
        <div className="flex items-center"><ThemeToggle /><Link href="/search" aria-label="Search" className="pressable grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-strong hover:text-ink"><Search aria-hidden size={20} /></Link><Link href="/notifications" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} className="pressable relative grid h-11 w-11 place-items-center rounded-xl text-muted hover:bg-surface-strong hover:text-ink"><Bell aria-hidden size={20} />{unreadCount ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-live ring-2 ring-canvas" /> : null}</Link></div>
      </div>
    </header>

    <div className="lg:pl-60">
      <main id="main-content" className="mx-auto max-w-[1120px] px-4 pb-32 pt-8 sm:px-8 sm:pt-10 lg:px-10 lg:pb-16 lg:pt-12">{children}</main>
    </div>
    <AppNav username={profile.username} mode="mobile" />
  </div>;
}
