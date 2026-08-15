import Link from "next/link";

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" className={`-mx-1 inline-flex min-h-11 items-center gap-2.5 rounded-lg px-1 font-[730] tracking-[-0.03em] ${inverse ? "text-white" : "text-ink"}`} aria-label="Relay home">
      <svg aria-hidden viewBox="0 0 36 36" className="h-9 w-9" fill="none">
        <rect width="36" height="36" rx="10" fill="var(--brand)" />
        <path d="M11 26V10h7.4c4.2 0 6.6 2.2 6.6 5.7 0 3.4-2.4 5.6-6.6 5.6H11m8.1 0L25.5 27" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="text-[18px]">Relay</span>
    </Link>
  );
}
