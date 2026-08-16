import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { AdminNav } from "@/features/admin/admin-nav";
import { requireAdmin } from "@/features/admin/auth";
import { Brand } from "@/components/shared/brand";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <div className="min-h-screen bg-canvas">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-[232px] flex-col bg-canvas px-3 py-3 lg:flex">
        <div className="flex items-center justify-between px-1 pb-3"><Brand href="/admin" /><span className="rounded-md bg-primary-soft px-2 py-1 text-[11px] font-bold text-primary">Admin</span></div>
        <div className="border-t border-line pt-3"><AdminNav mode="sidebar" /></div>
        <div className="mt-auto border-t border-line pt-3"><p className="truncate px-2 text-xs text-muted">{admin.email}</p><Link href="/home" className="sidebar-row pressable mt-2 flex min-h-9 items-center gap-2 rounded-md px-2 text-sm font-medium text-muted hover:bg-surface-strong/70 hover:text-ink"><ArrowLeft aria-hidden size={17} />Back to Relay</Link></div>
      </aside>

      <header className="app-chrome sticky top-0 z-20 border-b border-line lg:hidden"><div className="flex h-[56px] items-center justify-between px-4 sm:px-6"><div className="flex items-center gap-2"><Brand href="/admin" /><span className="rounded-md bg-primary-soft px-2 py-1 text-[11px] font-bold text-primary">Admin</span></div><Link href="/home" aria-label="Back to Relay" className="pressable grid h-10 w-10 place-items-center text-muted hover:text-ink"><ArrowLeft aria-hidden size={20} /></Link></div><AdminNav mode="mobile" /></header>

      <div className="lg:py-2 lg:pl-[240px] lg:pr-2"><div className="min-h-screen bg-surface lg:min-h-[calc(100vh-1rem)] lg:rounded-xl lg:border lg:border-line"><main id="main-content" className="mx-auto max-w-[1280px] px-4 pb-20 pt-7 sm:px-8 sm:pt-9 lg:px-10 lg:pb-16 lg:pt-10">{children}</main></div></div>
    </div>
  );
}
