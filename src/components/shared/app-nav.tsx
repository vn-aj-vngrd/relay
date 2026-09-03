"use client";

import {
  CalendarBlank,
  House,
  MapPin,
  PlusCircle,
  UsersThree,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  {
    href: "/home",
    label: "Home",
    icon: House,
    primary: false,
    mobileOnly: false,
  },
  {
    href: "/games",
    label: "Games",
    icon: CalendarBlank,
    primary: false,
    mobileOnly: false,
  },
  {
    href: "/games/new",
    label: "Create game",
    icon: PlusCircle,
    primary: true,
    mobileOnly: false,
  },
  {
    href: "/court",
    label: "Court",
    icon: MapPin,
    primary: false,
    mobileOnly: true,
  },
  {
    href: "/groups",
    label: "Groups",
    icon: UsersThree,
    primary: false,
    mobileOnly: false,
  },
];

export function AppNav({
  mode,
  invitationCount = 0,
}: {
  mode: "sidebar" | "mobile";
  invitationCount?: number;
}) {
  const pathname = usePathname();
  const isActive = (href: string) => {
    if (href === "/home") return pathname === "/home";
    if (href === "/games")
      return (
        pathname === "/games" ||
        (pathname.startsWith("/games/") && pathname !== "/games/new")
      );
    if (href === "/games/new") return pathname === "/games/new";
    return pathname.startsWith(href);
  };

  if (mode === "sidebar") {
    const desktopItems = items.filter(
      (item) => !item.primary && !item.mobileOnly
    );
    return (
      <nav aria-label="Main navigation">
        <ul className="space-y-0.5">
          {desktopItems.map(({ href, label, icon: Icon, primary }) => {
            const active = isActive(href);
            return (
              <li key={href} className={primary ? "mb-3" : undefined}>
                <Link
                  href={href}
                  data-tour={
                    label === "Create game"
                      ? "create"
                      : label === "Court"
                        ? "courts"
                        : label.toLowerCase()
                  }
                  prefetch={false}
                  aria-label={
                    label === "Games" && invitationCount
                      ? `Games, ${invitationCount} invites`
                      : label
                  }
                  aria-current={active ? "page" : undefined}
                  className={`sidebar-row sidebar-nav-item pressable group relative flex min-h-9 items-center gap-2.5 rounded-md px-2 text-[14px] font-medium ${primary ? "bg-primary text-white hover:bg-primary-hover" : active ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong/70 hover:text-ink"}`}
                >
                  <Icon
                    aria-hidden
                    size={18}
                    weight={active || primary ? "fill" : "regular"}
                    className={`shrink-0 ${primary ? "text-white" : active ? "text-primary" : "text-muted"}`}
                  />
                  <span className="sidebar-label flex min-w-0 flex-1 items-center justify-between gap-2">
                    <span>{label}</span>
                    {label === "Games" && invitationCount ? (
                      <span className="score inline-flex min-w-[18px] justify-center rounded-full bg-primary-soft px-1.5 py-0.5 text-[10px] font-bold text-primary">
                        {invitationCount > 99 ? "99+" : invitationCount}
                      </span>
                    ) : null}
                  </span>
                  <span role="tooltip" className="sidebar-item-tooltip">
                    {label === "Games" && invitationCount
                      ? `${label}, ${invitationCount} invites`
                      : label}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    );
  }

  if (pathname === "/games/new" || /^\/games\/[^/]+(?:\/.*)?$/.test(pathname))
    return null;

  return (
    <nav
      aria-label="Main navigation"
      className="mobile-chrome app-bottom-nav fixed inset-x-0 bottom-0 z-30 border-t border-line lg:hidden"
    >
      <ul className="mx-auto flex h-[60px] max-w-lg items-stretch px-2">
        {items.map(({ href, label, icon: Icon }) => {
          const active = isActive(href);
          return (
            <li key={href} className="min-w-0 flex-1">
              <Link
                href={href}
                data-tour={
                  label === "Create game"
                    ? "create"
                    : label === "Court"
                      ? "courts"
                      : label.toLowerCase()
                }
                prefetch={false}
                aria-current={active ? "page" : undefined}
                aria-label={
                  label === "Games" && invitationCount
                    ? `Games, ${invitationCount} invites`
                    : label
                }
                className={`app-mobile-tab pressable flex h-full flex-col items-center justify-center gap-0.5 rounded-lg text-[11px] font-[600] ${active ? "text-primary" : "text-muted hover:text-ink"}`}
              >
                <span
                  className={`app-mobile-tab-icon relative grid h-7 min-w-8 place-items-center rounded-lg ${active ? "bg-primary-soft" : ""}`}
                >
                  <Icon
                    aria-hidden
                    size={21}
                    weight={active ? "fill" : "regular"}
                  />
                  {label === "Games" && invitationCount ? (
                    <span className="score absolute -right-1.5 -top-1 inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[8px] font-bold text-white ring-2 ring-surface">
                      {invitationCount > 9 ? "9+" : invitationCount}
                    </span>
                  ) : null}
                </span>
                <span>{label === "Create game" ? "Create" : label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
