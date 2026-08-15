"use client";

import { CalendarDays, Home, LoaderCircle, Plus, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

const iconSize = 22;

export function AppNav({ username, mode }: { username: string; mode: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: CalendarDays },
    { href: "/games/new", label: "Create", icon: Plus, create: true },
    { href: "/groups", label: "Groups", icon: UsersRound },
    { href: `/profile/${username}`, label: "Profile", icon: UserRound },
  ];
  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    if (href === "/games") return pathname === "/games" || (pathname.startsWith("/games/") && pathname !== "/games/new");
    if (href === "/games/new") return pathname === "/games/new";
    return pathname.startsWith(href);
  };

  if (mode === "sidebar") {
    return <nav aria-label="Main navigation"><ul className="space-y-1.5">{items.map(({ href, label, icon: Icon, create }) => {
      const active = isActive(href);
      const pending = pendingHref === href && !active;
      return <li key={href}><Link href={href} prefetch={false} onClick={() => setPendingHref(href)} aria-current={active ? "page" : undefined} aria-busy={pending || undefined} className={`pressable flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-[680] ${create ? "my-4 bg-primary text-white hover:bg-primary-hover" : active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-strong hover:text-ink"}`}><span className={`grid h-8 w-8 place-items-center rounded-[9px] ${create ? "bg-white/12" : active ? "bg-primary text-white" : "bg-transparent"}`}>{pending ? <LoaderCircle aria-hidden className="animate-spin" size={iconSize} /> : <Icon aria-hidden size={iconSize} strokeWidth={active || create ? 2.6 : 2.25} />}</span><span>{label}</span></Link></li>;
    })}</ul></nav>;
  }

  if (pathname === "/games/new") return null;

  return <nav aria-label="Main navigation" className="mobile-chrome fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 rounded-[18px] border border-line px-1.5 shadow-[0_5px_8px_oklch(0.1_0.02_250/.13)] lg:hidden"><ul className="flex h-[68px] items-stretch justify-around">{items.map(({ href, label, icon: Icon, create }) => {
    const active = isActive(href);
    const pending = pendingHref === href && !active;
    return <li key={href} className="min-w-0 flex-1"><Link href={href} prefetch={false} onClick={() => setPendingHref(href)} aria-current={active ? "page" : undefined} aria-busy={pending || undefined} className={`pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] font-[700] ${active ? "text-primary" : "text-muted hover:text-ink"}`}><span className={`grid h-8 w-9 place-items-center rounded-[10px] ${active ? "bg-primary text-white" : create ? "bg-ink text-surface" : "bg-transparent"}`}>{pending ? <LoaderCircle aria-hidden className="animate-spin" size={iconSize} /> : <Icon aria-hidden size={create ? 23 : iconSize} strokeWidth={active || create ? 2.7 : 2.25} />}</span><span>{label}</span></Link></li>;
  })}</ul></nav>;
}
