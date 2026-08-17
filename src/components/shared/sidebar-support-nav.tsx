"use client";

import { Bell, Lifebuoy, ShieldCheck } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function SidebarSupportNav({ unreadCount, isAdmin }: { unreadCount: number; isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/notifications", label: "Notifications", icon: Bell, badge: unreadCount },
    { href: "/help", label: "Help Center", icon: Lifebuoy, badge: 0 },
    ...(isAdmin ? [{ href: "/admin", label: "Admin console", icon: ShieldCheck, badge: 0 }] : []),
  ];

  return <nav aria-label="Account support"><ul className="space-y-1">{items.map(({ href, label, icon: Icon, badge }) => {
    const active = pathname === href || (href === "/admin" && pathname.startsWith("/admin/"));
    return <li key={href}><Link href={href} data-tour={href === "/notifications" ? "notifications" : undefined} prefetch={false} aria-current={active ? "page" : undefined} className={`sidebar-row pressable flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium ${active ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong/70 hover:text-ink"}`}><Icon aria-hidden size={18} weight={active ? "fill" : "regular"} className={active ? "text-primary" : "text-muted"} /><span>{label}</span>{badge ? <span className="score ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-soft px-1.5 text-[10px] font-bold text-primary" aria-label={`${badge} unread notifications`}>{badge > 99 ? "99+" : badge}</span> : null}</Link></li>;
  })}</ul></nav>;
}
