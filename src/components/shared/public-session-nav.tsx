"use client";

import { usePathname } from "next/navigation";

import { ResponsiveSessionTabs } from "./responsive-session-tabs";
import { sessionTabs } from "./session-tabs";

export function PublicSessionNav({ slug }: { slug: string }) {
  const pathname = usePathname();
  const hrefBase = `/s/${slug}`;
  const active = sessionTabs().find((tab) => pathname === `${hrefBase}${tab.path}`)?.label ?? null;

  return (
    <nav aria-label="Game navigation" className="session-tab-safe public-session-scroll border-b border-line">
      <div className="mx-auto w-full max-w-6xl">
        <ResponsiveSessionTabs
          hrefBase={hrefBase}
          active={active}
          mobilePadding
          linkClassName="public-session-nav-link"
        />
      </div>
    </nav>
  );
}
