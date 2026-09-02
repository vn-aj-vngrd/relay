import Link from "next/link";

export function GamesSectionNav({ current }: { current: "mine" | "open" }) {
  return (
    <nav aria-label="Games sections" className="mt-2 overflow-x-auto border-b border-line">
      <ul className="flex min-w-max">
        {[
          { value: "mine" as const, label: "My games", href: "/games" },
          { value: "open" as const, label: "Open games", href: "/games/open" },
        ].map((item) => (
          <li key={item.value}>
            <Link
              href={item.href}
              aria-current={current === item.value ? "page" : undefined}
              className={`relative inline-flex min-h-11 items-center px-3 text-sm font-semibold ${current === item.value ? "text-ink after:absolute after:inset-x-3 after:bottom-0 after:h-0.5 after:rounded-full after:bg-primary" : "text-muted hover:text-ink"}`}
            >
              {item.label}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
