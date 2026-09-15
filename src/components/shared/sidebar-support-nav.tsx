"use client";

import { Bell, Lifebuoy } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarItemTooltip } from "./sidebar-item-tooltip";

export function SidebarSupportNav({
  unreadCount = 0,
}: {
  unreadCount?: number;
}) {
  const pathname = usePathname();
  const items = [
    {
      href: "/notifications",
      label: "Notifications",
      icon: Bell,
      badge: unreadCount,
    },
    { href: "/help", label: "Help Center", icon: Lifebuoy, badge: 0 },
  ];

  return (
    <nav aria-label="Account support">
      <ul className="space-y-1">
        {items.map(({ href, label, icon: Icon, badge }) => {
          const active = pathname === href || pathname.startsWith(`${href}/`);
          return (
            <li key={href}>
              <Link
                href={href}
                prefetch={false}
                data-tour={
                  href === "/notifications" ? "notifications" : undefined
                }
                aria-label={badge ? `${label}, ${badge} unread` : label}
                aria-current={active ? "page" : undefined}
                className={`sidebar-row sidebar-nav-item pressable group relative flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium ${active ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong/70 hover:text-ink"}`}
              >
                <Icon
                  aria-hidden
                  size={18}
                  weight={active ? "fill" : "regular"}
                  className={`shrink-0 ${active ? "text-primary" : "text-muted"}`}
                />
                <span className="sidebar-label">{label}</span>
                {badge ? (
                  <span
                    className="sidebar-badge score ml-auto inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-primary-soft px-1.5 text-[10px] font-bold text-primary"
                    aria-label={`${badge} unread notifications`}
                  >
                    {badge > 99 ? "99+" : badge}
                  </span>
                ) : null}
                <SidebarItemTooltip>
                  {label}
                  {badge ? ` · ${badge} unread` : ""}
                </SidebarItemTooltip>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
