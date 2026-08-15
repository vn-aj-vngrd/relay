import { Bell, Search } from "lucide-react";
import Link from "next/link";
import { and, eq, isNull } from "drizzle-orm";
import { AppNav } from "@/components/shared/app-nav";
import { db } from "@/db/client";
import { notifications } from "@/db/schema";
import { Brand } from "@/components/shared/brand";
import { requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await requireUser();
  const [profile, unreadCount] = await Promise.all([ensureProfile(user), db.$count(notifications, and(eq(notifications.userId, user.id), isNull(notifications.readAt)))]);
  return <div className="min-h-screen bg-canvas">
    <header className="app-chrome sticky top-0 z-20 border-b border-line">
      <div className="mx-auto flex h-[60px] max-w-[1180px] items-center justify-between px-4 sm:h-16 sm:px-6">
        <Brand />
        <div className="hidden md:block"><AppNav username={profile.username} /></div>
        <div className="flex items-center"><Link href="/search" aria-label="Search" className="pressable grid h-11 w-11 place-items-center rounded-full hover:bg-surface"><Search aria-hidden size={20} /></Link><Link href="/notifications" aria-label={unreadCount ? `Notifications, ${unreadCount} unread` : "Notifications"} className="pressable relative grid h-11 w-11 place-items-center rounded-full hover:bg-surface"><Bell aria-hidden size={20} />{unreadCount ? <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" /> : null}</Link></div>
      </div>
    </header>
    <main className="mx-auto max-w-[1180px] px-4 pb-28 pt-8 sm:px-6 md:pb-16 md:pt-12">{children}</main>
    <div className="md:hidden"><AppNav username={profile.username} /></div>
  </div>;
}
