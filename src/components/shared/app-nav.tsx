"use client";

import { CalendarDays, Home, Plus, UserRound, UsersRound } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export function AppNav({ username }: { username: string }) {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Home", icon: Home },
    { href: "/games", label: "Games", icon: CalendarDays },
    { href: "/games/new", label: "Create", icon: Plus, create: true },
    { href: "/groups", label: "Groups", icon: UsersRound },
    { href: `/profile/${username}`, label: "Profile", icon: UserRound },
  ];
  return <nav aria-label="Main navigation" className="mobile-chrome fixed inset-x-0 bottom-0 z-30 border-t border-line px-2 md:static md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
    <ul className="safe-bottom mx-auto flex max-w-lg items-end justify-around pt-1.5 md:max-w-none md:items-center md:gap-1 md:p-0">
      {items.map(({ href, label, icon: Icon, create }) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <li key={href} className="flex-1 md:flex-none">
        <Link href={href} aria-current={active ? "page" : undefined} className={`pressable flex min-h-12 flex-col items-center justify-center gap-1 rounded-[10px] px-1 text-[11px] font-[620] md:min-h-10 md:flex-row md:gap-2 md:px-3 md:text-sm ${create ? "text-primary md:bg-primary md:text-white md:hover:bg-primary-hover" : active ? "text-primary md:bg-primary-soft" : "text-muted hover:bg-surface-strong hover:text-ink"}`}>
          <span className={create ? "grid h-8 w-8 place-items-center rounded-[10px] bg-primary text-white md:h-auto md:w-auto md:bg-transparent" : ""}><Icon aria-hidden size={create ? 20 : 20} strokeWidth={2} /></span><span>{label}</span>
        </Link>
      </li>; })}
    </ul>
  </nav>;
}
