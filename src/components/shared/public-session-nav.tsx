"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { SESSION_TABS } from "./session-tabs";

export function PublicSessionNav({ slug }: { slug: string }) {
  const pathname = usePathname();

  return <nav aria-label="Game navigation" className="public-session-scroll overflow-x-auto">
    <div className="mx-auto w-full max-w-4xl">
      <ul className="flex w-max border-b border-line px-1 sm:px-3">
        {SESSION_TABS.map((tab) => {
          const href = `/s/${slug}${tab.path}`;
          const active = pathname === href;
          return <li key={tab.label}><Link href={href} aria-current={active ? "page" : undefined} className={`public-session-nav-link relative flex min-h-11 items-center px-3 text-[13px] font-medium ${active ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}>{tab.label}</Link></li>;
        })}
      </ul>
    </div>
  </nav>;
}
