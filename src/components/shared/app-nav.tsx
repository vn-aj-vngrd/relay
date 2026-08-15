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
    <ul className="safe-bottom mx-auto flex max-w-lg items-end justify-around pt-1.5 md:max-w-none md:gap-1 md:p-0">
      {items.map(({ href, label, icon: Icon, create }) => { const active = href === "/" ? pathname === "/" : pathname.startsWith(href); return <li key={href} className="flex-1 md:flex-none">
        <Link href={href} aria-current={active ? "page" : undefined} className={`pressable flex min-h-12 flex-col items-center justify-center gap-1 rounded-xl text-[11px] font-[590] md:min-h-10 md:flex-row md:px-3 md:text-sm ${create ? "text-primary" : active ? "text-primary md:bg-primary-soft" : "text-muted hover:bg-surface hover:text-ink"}`}>
          <span className={create ? "-mt-5 grid h-11 w-11 place-items-center rounded-full bg-primary text-white shadow-[inset_0_1px_0_oklch(1_0_0/.24)] md:mt-0 md:h-auto md:w-auto md:bg-transparent md:text-primary" : ""}><Icon aria-hidden size={create ? 23 : 21} strokeWidth={2} /></span><span>{label}</span>
        </Link>
      </li>; })}
    </ul>
  </nav>;
}
