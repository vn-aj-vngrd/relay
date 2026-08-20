"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { sessionTabs } from "./session-tabs";

export function PublicSessionNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const activeRef = useRef<HTMLAnchorElement>(null);
  useEffect(() => {
    const frame = requestAnimationFrame(() =>
      activeRef.current?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: "auto" }),
    );
    return () => cancelAnimationFrame(frame);
  }, [pathname]);

  return (
    <nav aria-label="Game navigation" className="public-session-scroll overflow-x-auto">
      <div className="mx-auto w-full max-w-6xl">
        <ul className="flex w-max border-b border-line px-1 sm:px-3">
          {sessionTabs().map((tab) => {
            const href = `/s/${slug}${tab.path}`;
            const active = pathname === href;
            return (
              <li key={tab.label}>
                <Link
                  ref={active ? activeRef : undefined}
                  href={href}
                  aria-current={active ? "page" : undefined}
                  className={`public-session-nav-link relative flex min-h-11 items-center px-3 text-[13px] font-medium ${active ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}
                >
                  {tab.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </nav>
  );
}
