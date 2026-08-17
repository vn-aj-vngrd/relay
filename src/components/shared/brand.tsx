export function RelayMark({ className = "h-7 w-7" }: { inverse?: boolean; className?: string }) {
  return <span aria-hidden="true" className={`block shrink-0 rounded-full bg-signal shadow-[inset_-0.16em_0_0_rgb(23_23_25/.18)] ${className}`} />;
}

export function Brand({ inverse = false, href = "/" }: { inverse?: boolean; href?: string }) {
  return (
    <a
      href={href}
      className={`-mx-1 inline-flex min-h-11 items-center gap-2 px-1 text-[16px] font-[700] tracking-[-0.035em] ${inverse ? "text-white" : "text-ink"}`}
      aria-label="Relay home"
    >
      <RelayMark inverse={inverse} />
      <span className="brand-wordmark">Relay</span>
    </a>
  );
}
