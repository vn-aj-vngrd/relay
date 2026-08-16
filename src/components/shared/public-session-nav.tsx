"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { label: "Plan", path: "" },
  { label: "Players", path: "/players" },
  { label: "Courts", path: "/courts" },
  { label: "Chat", path: "/chat" },
  { label: "Payments", path: "/payments" },
];

export function PublicSessionNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  return <nav aria-label="Public game navigation" className="overflow-x-auto border-b border-line bg-surface px-4 py-3 sm:px-6"><ul className="mx-auto flex min-w-max max-w-[1040px] gap-0.5 rounded-lg bg-surface-strong p-1">{tabs.map((tab) => { const href = `/s/${slug}${tab.path}`; const active = pathname === href; return <li key={tab.label}><Link href={href} aria-current={active ? "page" : undefined} className={`flex min-h-8 items-center rounded-md px-3 text-sm font-medium ${active ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}>{tab.label}</Link></li>; })}</ul></nav>;
}
