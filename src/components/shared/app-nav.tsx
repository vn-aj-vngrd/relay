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
    return <nav aria-label="Main navigation"><ul className="space-y-1">{items.map(({ href, label, icon: Icon, create }) => {
      const active = isActive(href);
      const pending = pendingHref === href && !active;
      return <li key={href}><Link href={href} prefetch={false} onClick={() => setPendingHref(href)} aria-current={active ? "page" : undefined} aria-busy={pending || undefined} className={`pressable flex min-h-12 items-center gap-3 rounded-[10px] px-3 text-[15px] font-[650] ${create ? "my-4 bg-primary text-white hover:bg-primary-hover" : active ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong hover:text-ink"}`}>{pending ? <LoaderCircle aria-hidden className="animate-spin" size={iconSize} /> : <Icon aria-hidden className={active && !create ? "text-primary" : ""} size={iconSize} strokeWidth={active || create ? 2.4 : 2.1} />}<span>{label}</span></Link></li>;
    })}</ul></nav>;
  }

  if (pathname === "/games/new") return null;

  return <nav aria-label="Main navigation" className="mobile-chrome safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line lg:hidden"><ul className="mx-auto flex h-[64px] max-w-lg items-stretch px-2">{items.map(({ href, label, icon: Icon, create }) => {
    const active = isActive(href);
    const pending = pendingHref === href && !active;
    return <li key={href} className="min-w-0 flex-1"><Link href={href} prefetch={false} onClick={() => setPendingHref(href)} aria-current={active ? "page" : undefined} aria-busy={pending || undefined} className={`pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] font-[650] ${active ? "text-primary" : "text-muted"}`}><span className={create ? "grid h-7 w-7 place-items-center rounded-full bg-primary text-white" : "grid h-7 place-items-center"}>{pending ? <LoaderCircle aria-hidden className="animate-spin" size={iconSize} /> : <Icon aria-hidden size={create ? 19 : iconSize} strokeWidth={active || create ? 2.5 : 2.1} />}</span><span>{label}</span></Link></li>;
  })}</ul></nav>;
}
