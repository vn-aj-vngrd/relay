import Link from "next/link";

const tabs = [
  { label: "Plan", path: "" },
  { label: "Players", path: "/players" },
  { label: "Courts", path: "/courts" },
  { label: "Chat", path: "/chat" },
  { label: "Payments", path: "/payments" },
];

export function PublicSessionNav({ slug, active }: { slug: string; active: string }) {
  return <nav aria-label="Public game navigation" className="overflow-x-auto border-b border-line bg-surface px-4 py-3 sm:px-6"><ul className="mx-auto flex min-w-max max-w-[1040px] gap-0.5 rounded-lg bg-surface-strong p-1">{tabs.map((tab) => <li key={tab.label}><Link href={`/s/${slug}${tab.path}`} aria-current={active === tab.label ? "page" : undefined} className={`flex min-h-8 items-center rounded-md px-3 text-sm font-medium ${active === tab.label ? "bg-surface text-ink shadow-[0_1px_3px_oklch(0.1_0.01_275/.1)]" : "text-muted hover:text-ink"}`}>{tab.label}</Link></li>)}</ul></nav>;
}
