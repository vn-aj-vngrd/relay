"use client";

import { CalendarBlank, House, PlusCircle, UserCircle, UsersThree } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = (username: string) => [
  { href: "/home", label: "Home", icon: House },
  { href: "/games", label: "Games", icon: CalendarBlank },
  { href: "/games/new", label: "Create game", icon: PlusCircle, primary: true },
  { href: "/groups", label: "Groups", icon: UsersThree },
  { href: `/profile/${username}`, label: "Profile", icon: UserCircle },
];

export function AppNav({ username, mode }: { username: string; mode: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/games") return pathname === "/games" || (pathname.startsWith("/games/") && pathname !== "/games/new");
    if (href === "/games/new") return pathname === "/games/new";
    return pathname.startsWith(href);
  };

  if (mode === "sidebar") {
    const desktopItems = items(username).filter((item) => item.label !== "Profile" && !item.primary);
    return <nav aria-label="Main navigation"><ul className="space-y-0.5">{desktopItems.map(({ href, label, icon: Icon, primary }) => {
      const active = isActive(href);
      return <li key={href} className={primary ? "mb-3" : undefined}><Link href={href} data-tour={label === "Create game" ? "create" : label.toLowerCase()} prefetch={false} aria-label={label} aria-current={active ? "page" : undefined} className={`sidebar-row sidebar-nav-item pressable group relative flex min-h-9 items-center gap-2.5 rounded-md px-2 text-[14px] font-medium ${primary ? "bg-primary text-white hover:bg-primary-hover" : active ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong/70 hover:text-ink"}`}><Icon aria-hidden size={18} weight={active || primary ? "fill" : "regular"} className={`shrink-0 ${primary ? "text-white" : active ? "text-primary" : "text-muted"}`} /><span className="sidebar-label">{label}</span><span role="tooltip" className="sidebar-item-tooltip">{label}</span></Link></li>;
    })}</ul></nav>;
  }

  if (pathname === "/games/new") return null;

  return <nav aria-label="Main navigation" className="mobile-chrome safe-bottom fixed inset-x-0 bottom-0 z-30 border-t border-line lg:hidden"><ul className="mx-auto flex h-16 max-w-lg items-stretch px-2">{items(username).map(({ href, label, icon: Icon }) => {
    const active = isActive(href);
    return <li key={href} className="min-w-0 flex-1"><Link href={href} data-tour={label === "Create game" ? "create" : label.toLowerCase()} prefetch={false} aria-current={active ? "page" : undefined} className={`pressable flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium ${active ? "text-primary" : "text-muted"}`}><Icon aria-hidden size={21} weight={active ? "fill" : "regular"} /><span>{label === "Create game" ? "Create" : label}</span></Link></li>;
  })}</ul></nav>;
}
