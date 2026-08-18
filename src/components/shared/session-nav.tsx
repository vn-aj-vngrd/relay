import Link from "next/link";
import { SESSION_TABS, type SessionTabLabel } from "./session-tabs";

export function SessionNav({ id, active = "Overview", embedded = false }: { id: string; active?: SessionTabLabel | null; embedded?: boolean }) {
  return <nav aria-label="Game navigation" className={`public-session-scroll overflow-x-auto ${embedded ? "min-w-0 flex-1 basis-full sm:basis-auto" : "-mx-4 border-b border-line px-2 sm:-mx-6 sm:px-6"}`}><ul className="flex min-w-max">{SESSION_TABS.map((tab) => <li key={tab.label}><Link href={`/games/${id}${tab.path}`} aria-current={active === tab.label ? "page" : undefined} className={`relative flex min-h-11 items-center px-3 text-[13px] font-medium ${active === tab.label ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}>{tab.label}</Link></li>)}</ul></nav>;
}
