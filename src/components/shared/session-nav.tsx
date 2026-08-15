import Link from "next/link";

const tabs = [
  { label: "Overview", path: "" }, { label: "Players", path: "/players" }, { label: "Courts", path: "/live" }, { label: "Chat", path: "/chat" }, { label: "More", path: "/more" },
];

export function SessionNav({ id, active = "Overview" }: { id: string; active?: string }) {
  return <nav aria-label="Game navigation" className="-mx-4 overflow-x-auto border-b border-line px-4 sm:-mx-6 sm:px-6"><ul className="flex min-w-max gap-6">{tabs.map((tab) => <li key={tab.label}><Link href={`/games/${id}${tab.path}`} prefetch={false} aria-current={active === tab.label ? "page" : undefined} className={`flex min-h-12 items-center border-b-2 text-sm font-semibold ${active === tab.label ? "border-primary text-ink" : "border-transparent text-muted hover:text-ink"}`}>{tab.label}</Link></li>)}</ul></nav>;
}
