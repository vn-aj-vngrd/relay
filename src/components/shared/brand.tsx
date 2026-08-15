import Link from "next/link";

export function RelayMark({ inverse = false, className = "h-9 w-9" }: { inverse?: boolean; className?: string }) {
  const ink = inverse ? "white" : "var(--ink)";
  return <svg aria-hidden viewBox="0 0 40 40" className={className} fill="none">
    <path d="M8.5 5.5h23v29h-23z" stroke={ink} strokeWidth="2" />
    <path d="M8.5 20h23" stroke="var(--primary)" strokeWidth="2.5" />
    <path d="M20 5.5v10.25M20 24.25V34.5" stroke={ink} strokeWidth="1.5" />
    <path d="M11 30.5 28.5 9" stroke="var(--primary)" strokeWidth="1.5" strokeDasharray="2.5 3.5" opacity=".62" />
    <circle cx="28.5" cy="9" r="4.25" fill="var(--signal)" stroke={ink} strokeWidth="1.25" />
    <circle cx="27.2" cy="7.8" r=".55" fill="var(--ink)" opacity=".55" />
    <circle cx="29.8" cy="9.8" r=".55" fill="var(--ink)" opacity=".55" />
  </svg>;
}

export function Brand({ inverse = false }: { inverse?: boolean }) {
  return (
    <Link href="/" prefetch={false} className={`-mx-1 inline-flex min-h-11 items-center gap-2 px-1 font-[750] tracking-[-0.035em] ${inverse ? "text-white" : "text-ink"}`} aria-label="Relay home">
      <RelayMark inverse={inverse} />
      <span className="text-[19px]">Relay</span>
    </Link>
  );
}
