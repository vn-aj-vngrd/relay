"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Plan", path: "" },
  { label: "Players", path: "/players" },
  { label: "Courts", path: "/courts" },
  { label: "Chat", path: "/chat" },
  { label: "Payments", path: "/payments" },
  { label: "More", path: "/more" },
];

export function PublicSessionNav({ slug, inline = false }: { slug: string; inline?: boolean }) {
  const pathname = usePathname();
  return <nav aria-label="Public game navigation" className={inline ? "public-session-nav-inline public-session-scroll overflow-x-auto" : "public-session-scroll overflow-x-auto border-b border-line px-2 sm:px-6 md:hidden"}><ul className={inline ? "flex min-w-max" : "mx-auto flex w-max min-w-full max-w-[1040px]"}>{tabs.map((tab) => { const href = `/s/${slug}${tab.path}`; const active = pathname === href; return <li key={tab.label} className="flex-1"><Link href={href} aria-current={active ? "page" : undefined} className={`public-session-nav-link relative flex items-center justify-center px-1 text-[13px] font-medium min-[380px]:px-2 min-[380px]:text-sm md:px-3 ${active ? "text-ink after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}>{tab.label}</Link></li>; })}</ul></nav>;
}
