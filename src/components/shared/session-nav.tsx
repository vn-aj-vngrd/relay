import Link from "next/link";

const tabs = [
  { label: "Overview", path: "" }, { label: "Players", path: "/players" }, { label: "Courts", path: "/live" }, { label: "Chat", path: "/chat" }, { label: "More", path: "/more" },
];

export function SessionNav({ id, active = "Overview" }: { id: string; active?: string }) {
  return <nav aria-label="Game navigation" className="-mx-4 overflow-x-auto px-4 py-3 sm:-mx-6 sm:px-6"><ul className="inline-flex min-w-max gap-0.5 rounded-lg bg-surface-strong p-1">{tabs.map((tab) => <li key={tab.label}><Link href={`/games/${id}${tab.path}`} prefetch={false} aria-current={active === tab.label ? "page" : undefined} className={`flex min-h-8 items-center rounded-md px-3 text-sm font-medium ${active === tab.label ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}>{tab.label}</Link></li>)}</ul></nav>;
}
