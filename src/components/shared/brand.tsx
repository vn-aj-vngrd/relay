export function RelayMark({ inverse = false, className = "h-7 w-7" }: { inverse?: boolean; className?: string }) {
  const field = inverse ? "white" : "var(--ink)";
  const line = inverse ? "#08090a" : "var(--surface)";
  return <svg aria-hidden viewBox="0 0 32 32" className={className} fill="none">
    <circle cx="16" cy="16" r="12" fill={field} />
    <path d="M5.5 16h21" stroke={line} strokeWidth="1.75" />
    <path d="M16 4v7M16 21v7" stroke={line} strokeWidth="1.5" opacity=".9" />
    <circle cx="21" cy="10.5" r="2.5" fill="var(--signal)" />
  </svg>;
}

export function Brand({ inverse = false, href = "/" }: { inverse?: boolean; href?: string }) {
  return <a href={href} className={`-mx-1 inline-flex min-h-11 items-center gap-2 px-1 font-semibold tracking-[-0.02em] ${inverse ? "text-white" : "text-ink"}`} aria-label="Relay home"><RelayMark inverse={inverse} /><span className="text-[16px]">Relay</span></a>;
}
