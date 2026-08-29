"use client";

import { CaretRight } from "@phosphor-icons/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export type BreadcrumbItem = {
  href?: string;
  label: string;
};

const labels: Record<string, string> = {
  admin: "Admin Console",
  audit: "Audit log",
  chat: "Chat",
  court: "Find a court",
  courts: "Play",
  edit: "Edit",
  feedback: "Feedback",
  games: "Games",
  groups: "Groups",
  help: "Help Center",
  home: "Home",
  live: "Play",
  more: "More",
  new: "Create",
  notifications: "Notifications",
  payments: "Payments",
  play: "Play",
  players: "Players",
  preferences: "Preferences",
  profile: "Profile",
  story: "Story",
  search: "Search",
  sessions: "Games",
  settings: "Settings",
  users: "Users",
};

function titleCase(value: string) {
  return decodeURIComponent(value)
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function isGameId(segments: string[], index: number) {
  return segments[index - 1] === "games" && segments[index] !== "new";
}

function isAdminRecord(segments: string[], index: number) {
  return (
    segments[0] === "admin" &&
    ["courts", "feedback", "sessions", "users", "venues"].includes(segments[index - 1]) &&
    segments[index] !== "new"
  );
}

function segmentLabel(segments: string[], index: number) {
  const segment = segments[index];
  if (segments[0] === "admin" && (segment === "courts" || segment === "venues")) return "Courts";
  if (isGameId(segments, index)) return "Game";
  if (isAdminRecord(segments, index)) {
    if (segments[index - 1] === "users") return "User";
    if (segments[index - 1] === "feedback") return "Submission";
    if (segments[index - 1] === "courts" || segments[index - 1] === "venues") return "Court";
    return "Game";
  }
  if (segments[index - 1] === "profile") return "Profile";
  return labels[segment] ?? titleCase(segment);
}

export function buildBreadcrumbItems(pathname: string): BreadcrumbItem[] {
  const segments = pathname.split("/").filter(Boolean);
  if (!segments.length) return [];
  if (segments[0] === "home") return [{ label: "Home" }];
  if (segments[0] === "games" && segments[1] && segments[1] !== "new") return [];

  const items: BreadcrumbItem[] = segments[0] === "admin" ? [] : [{ href: "/home", label: "Home" }];

  segments.forEach((segment, index) => {
    if (segment === "profile" && index < segments.length - 1) return;
    const current = index === segments.length - 1;
    const path = `/${segments.slice(0, index + 1).join("/")}`;
    let href = current ? undefined : path;
    if (segment === "court") href = current ? undefined : "/court";
    items.push({ href, label: segmentLabel(segments, index) });
  });

  return items;
}

export function AppBreadcrumbs({ items: providedItems }: { items?: BreadcrumbItem[] }) {
  const routeItems = buildBreadcrumbItems(usePathname());
  const items = providedItems ?? routeItems;
  if (!items.length) return null;

  return (
    <nav
      aria-label="Breadcrumb"
      className="mb-4 hidden shrink-0 overflow-x-auto [scrollbar-width:none] sm:block [&::-webkit-scrollbar]:hidden"
    >
      <ol className="flex min-w-max items-center text-[13px] text-muted">
        {items.map((item, index) => (
          <li key={`${item.label}-${index}`} className="flex items-center">
            {index ? <CaretRight aria-hidden size={12} className="mx-1 shrink-0 text-muted/65" /> : null}
            {item.href ? (
              <Link
                href={item.href}
                className="pressable inline-flex h-8 items-center rounded-md px-1.5 font-medium hover:bg-surface-strong hover:text-ink"
              >
                {item.label}
              </Link>
            ) : (
              <span aria-current="page" className="inline-flex h-8 items-center px-1.5 font-medium text-ink">
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
