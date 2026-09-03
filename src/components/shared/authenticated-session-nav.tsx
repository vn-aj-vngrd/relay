"use client";

import { usePathname } from "next/navigation";

import { SessionNav } from "./session-nav";
import type { SessionTabLabel } from "./session-tabs";

export function activeTab(pathname: string): SessionTabLabel | null {
  if (pathname.endsWith("/players")) return "Players";
  if (/\/games\/[^/]+\/play(?:\/|$)/.test(pathname)) return "Play";
  if (pathname.endsWith("/chat")) return "Chat";
  if (pathname.endsWith("/payments")) return "Payments";
  if (pathname.endsWith("/story")) return "Story";
  if (/\/games\/[^/]+$/.test(pathname)) return "Overview";
  return null;
}

export function AuthenticatedSessionNav({ id }: { id: string }) {
  return <SessionNav id={id} active={activeTab(usePathname())} embedded />;
}

export function MobileAuthenticatedSessionNav({ id }: { id: string }) {
  return (
    <SessionNav
      id={id}
      active={activeTab(usePathname())}
      embedded
      padded={false}
    />
  );
}
