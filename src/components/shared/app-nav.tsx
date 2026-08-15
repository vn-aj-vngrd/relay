"use client";

import { CalendarDays, Home, LoaderCircle, Plus, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const iconSize = 21;

export function AppNav({ username, mode }: { username: string; mode: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const router = useRouter();
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
    return <nav aria-label="Main navigation"><ul className="space-y-1">{items.map(({ href, label, icon: Icon, create }) => { const active = isActive(href); const pending = pendingHref === href && !active; return <li key={href}><Link href={href} prefetch={false} onMouseEnter={() => router.prefetch(href)} onFocus={() => router.prefetch(href)} onClick={() => setPendingHref(href)} aria-current={active ? "page" : undefined} aria-busy={pending || undefined} className={`pressable flex min-h-12 items-center gap-3 rounded-xl px-3 text-[15px] font-[620] ${create ? "my-3 bg-primary text-white hover:bg-primary-hover" : active ? "bg-primary-soft text-primary" : "text-muted hover:bg-surface-strong hover:text-ink"}`}>{pending ? <LoaderCircle aria-hidden className="animate-spin" size={iconSize} /> : <Icon aria-hidden size={iconSize} strokeWidth={active ? 2.35 : 2} />}<span>{label}</span></Link></li>; })}</ul></nav>;
  }

  if (pathname === "/games/new") return null;

  return <nav aria-label="Main navigation" className="mobile-chrome fixed inset-x-3 bottom-[max(.75rem,env(safe-area-inset-bottom))] z-30 rounded-2xl border border-line px-2 shadow-[0_4px_8px_oklch(0.1_0.02_250/.12)] lg:hidden"><ul className="flex h-16 items-stretch justify-around">{items.map(({ href, label, icon: Icon }) => { const active = isActive(href); const pending = pendingHref === href && !active; return <li key={href} className="min-w-0 flex-1"><Link href={href} prefetch={false} onClick={() => setPendingHref(href)} aria-current={active ? "page" : undefined} aria-busy={pending || undefined} className={`pressable flex h-full flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-[650] ${active ? "text-primary" : "text-muted hover:text-ink"}`}>{pending ? <LoaderCircle aria-hidden className="animate-spin" size={iconSize} /> : <Icon aria-hidden size={iconSize} strokeWidth={active ? 2.4 : 2} />}<span>{label}</span></Link></li>; })}</ul></nav>;
}
