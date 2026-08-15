import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className={`-mx-1 inline-flex min-h-11 items-center gap-2.5 rounded-lg px-1 font-[730] tracking-[-0.03em] ${inverse ? "text-white" : "text-ink"}`} aria-label="Relay home">
      <svg aria-hidden viewBox="0 0 36 36" className="h-9 w-9" fill="none">
        <rect width="36" height="36" rx="10" fill="var(--brand)" />
        <rect x="8.5" y="6.5" width="19" height="23" rx="1.5" stroke="white" strokeWidth="1.7" />
        <path d="M8.5 18h19" stroke="var(--court-line)" strokeWidth="1.8" />
        <path d="M18 6.5v8M18 21.5v8" stroke="white" strokeWidth="1.35" />
        <circle cx="22.5" cy="12.2" r="2.35" fill="var(--signal)" />
      </svg>
      <span className="text-[18px]">Relay</span>
    </Link>
  );
}
