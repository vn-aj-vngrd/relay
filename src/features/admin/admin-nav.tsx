"use client";

import {
  ChartBar,
  ChatText,
  ClockCounterClockwise,
  Gauge,
  MapPin,
  Users,
  Volleyball,
} from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

const items = [
  { href: "/admin", label: "Overview", icon: Gauge },
  { href: "/admin/users", label: "Users", icon: Users },
  { href: "/admin/insights", label: "Insights", icon: ChartBar },
  { href: "/admin/sessions", label: "Games", icon: Volleyball },
  { href: "/admin/courts", label: "Courts", icon: MapPin },
  { href: "/admin/feedback", label: "Feedback", icon: ChatText },
  { href: "/admin/audit", label: "Audit log", icon: ClockCounterClockwise },
];

export function AdminNav({ mode }: { mode: "sidebar" | "mobile" }) {
  const pathname = usePathname();
  const active = (href: string) =>
    href === "/admin" ? pathname === href : pathname.startsWith(href);

  if (mode === "mobile") {
    return (
      <nav
        aria-label="Admin navigation"
        className="focus-scroll-rail overflow-x-auto border-b border-line"
        onFocusCapture={(event) =>
          event.target.scrollIntoView({ block: "nearest", inline: "nearest" })
        }
      >
        <ul className="flex min-w-max px-3">
          {items.map(({ href, label }) => (
            <li key={href}>
              <Link
                href={href}
                aria-current={active(href) ? "page" : undefined}
                className={`flex min-h-11 items-center border-b-2 px-3 text-sm font-semibold ${active(href) ? "border-primary text-ink" : "border-transparent text-muted"}`}
              >
                {label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    );
  }

  return (
    <nav aria-label="Admin navigation">
      <ul className="space-y-0.5">
        {items.map(({ href, label, icon: Icon }) => (
          <li key={href}>
            <Link
              href={href}
              aria-current={active(href) ? "page" : undefined}
              className={`pressable flex min-h-9 items-center gap-2.5 rounded-md px-2 text-sm font-medium ${active(href) ? "bg-surface-strong text-ink" : "text-muted hover:bg-surface-strong/70 hover:text-ink"}`}
            >
              <Icon
                aria-hidden
                size={18}
                weight={active(href) ? "fill" : "regular"}
                className={active(href) ? "text-primary" : ""}
              />
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
