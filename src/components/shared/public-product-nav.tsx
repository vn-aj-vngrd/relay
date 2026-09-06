"use client";

import {
  CalendarDots,
  Lightning,
  MapPin,
  PlusCircle,
  Question,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SidebarItemTooltip } from "./sidebar-item-tooltip";

const items = [
  {
    href: "/games/new",
    label: "Create game",
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
  { href: "/help", label: "Help Center", shortLabel: "Help", icon: Question },
] as const;

function isActive(pathname: string, href: string) {
  if (href === "/courts" || href === "/help")
    return pathname === href || pathname.startsWith(`${href}/`);
  return pathname === href;
}

export function PublicProductNav({
  mode,
}: {
  mode: "sidebar" | "sidebar-support" | "mobile";
}) {
  const pathname = usePathname();

  if (mode !== "mobile")
    return (
      <nav
        aria-label={
          mode === "sidebar-support" ? "Public support" : "Explore Relay"
        }
      >
        {mode === "sidebar" ? (
          <p className="sidebar-label mb-2 px-2 text-xs font-semibold text-muted">
            Try Relay
          </p>
        ) : null}
        <ul className="space-y-0.5">
          {items
            .filter((item) =>
              mode === "sidebar-support"
                ? item.href === "/help"
                : item.href !== "/help"
            )
            .map(({ href, label, icon: Icon }) => {
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
                    <SidebarItemTooltip>{label}</SidebarItemTooltip>
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
