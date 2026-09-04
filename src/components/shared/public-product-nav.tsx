"use client";

import {
  CalendarDots,
  Lightning,
  MapPin,
  PlusCircle,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/games/new",
    label: "Plan a game",
    shortLabel: "Plan",
    icon: PlusCircle,
  },
  { href: "/courts", label: "Find courts", shortLabel: "Courts", icon: MapPin },
  { href: "/play", label: "Quick Play", shortLabel: "Play", icon: Lightning },
  {
    href: "/games/open",
    label: "Open games",
    shortLabel: "Open",
    icon: CalendarDots,
  },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/courts")
    return pathname === href || pathname.startsWith("/courts/");
  return pathname === href;
}

export function PublicProductNav({ mode }: { mode: "sidebar" | "mobile" }) {
  const pathname = usePathname();

  if (mode === "sidebar")
    return (
      <nav aria-label="Explore Relay">
        <p className="sidebar-label mb-2 px-2 text-xs font-semibold text-muted">
          Try Relay
        </p>
        <ul className="space-y-0.5">
          {items.map(({ href, label, icon: Icon }) => {
            const active = isActive(pathname, href);
            return (
              <li key={href}>
                <Link
                  href={href}
                  prefetch={false}
                  aria-label={label}
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
                  <span role="tooltip" className="sidebar-item-tooltip">
                    {label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );

  return (
    <nav
      aria-label="Explore Relay"
      className="mobile-chrome app-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-line lg:hidden"
    >
      <ul className="mx-auto flex h-[60px] max-w-lg items-stretch px-2">
        {items.map(({ href, shortLabel, label, icon: Icon }) => {
          const active = isActive(pathname, href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                prefetch={false}
                aria-label={label}
                aria-current={active ? "page" : undefined}
                className={`app-mobile-tab pressable flex h-full flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-[600] ${active ? "text-primary" : "text-muted hover:text-ink"}`}
              >
                <span
                  className={`app-mobile-tab-icon grid h-7 min-w-8 place-items-center rounded-lg ${active ? "bg-primary-soft" : ""}`}
                >
                  <Icon
                    aria-hidden
                    size={21}
                    weight={active ? "fill" : "regular"}
                  />
                </span>
                <span>{shortLabel}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
