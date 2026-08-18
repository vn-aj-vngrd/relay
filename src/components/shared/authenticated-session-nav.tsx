"use client";

import { usePathname } from "next/navigation";

import { SessionNav } from "./session-nav";
import type { SessionTabLabel } from "./session-tabs";

function activeTab(pathname: string): SessionTabLabel | null {
  if (pathname.endsWith("/players")) return "Players";
  if (pathname.endsWith("/play")) return "Play";
  if (pathname.endsWith("/chat")) return "Chat";
  if (pathname.endsWith("/payments")) return "Payments";
  if (/\/games\/[^/]+$/.test(pathname)) return "Overview";
  return null;
}

export function AuthenticatedSessionNav({ id }: { id: string }) {
  return <SessionNav id={id} active={activeTab(usePathname())} embedded />;
}
