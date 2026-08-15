import { Bell } from "lucide-react";
import Link from "next/link";
import { AppNav } from "@/components/shared/app-nav";
import { Brand } from "@/components/shared/brand";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-canvas">
    <header className="border-b border-line">
      <div className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-4 sm:px-6">
        <Brand />
        <div className="hidden md:block"><AppNav /></div>
        <Link href="/notifications" aria-label="Notifications, 2 unread" className="pressable relative grid h-11 w-11 place-items-center rounded-full hover:bg-surface"><Bell aria-hidden size={20} /><span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-accent ring-2 ring-canvas" /></Link>
      </div>
    </header>
    <main className="mx-auto max-w-[1180px] px-4 pb-28 pt-7 sm:px-6 md:pb-12 md:pt-10">{children}</main>
    <div className="md:hidden"><AppNav /></div>
  </div>;
}
