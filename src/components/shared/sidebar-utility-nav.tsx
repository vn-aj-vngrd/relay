"use client";

import { MagnifyingGlass, PlusCircle } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/games/new", label: "Create", icon: PlusCircle, tour: "create" },
  { href: "/search", label: "Search", icon: MagnifyingGlass, tour: "search" },
];

export function SidebarUtilityNav() {
  const pathname = usePathname();
  return <nav aria-label="Quick actions"><ul className="space-y-0.5">{items.map(({ href, label, icon: Icon, tour }) => {
    const active = pathname === href;
    return <li key={href}><Link href={href} data-tour={tour} prefetch={false} aria-current={active ? "page" : undefined} className={`sidebar-row pressable flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium ${active ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong/70 hover:text-ink"}`}><Icon aria-hidden size={18} weight={active ? "fill" : "regular"} className={active ? "text-primary" : "text-muted"} />{label}</Link></li>;
  })}</ul></nav>;
}
