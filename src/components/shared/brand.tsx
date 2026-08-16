export function RelayMark({ className = "h-7 w-7" }: { inverse?: boolean; className?: string }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 32 32" className={className}>
      <path
        fill="var(--signal)"
        fillRule="evenodd"
        clipRule="evenodd"
        d="M16 3a13 13 0 1 0 0 26 13 13 0 0 0 0-26ZM12 8.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm8-1a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5ZM9 15.25a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm9-1a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm-4 7a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Zm9-2a1.75 1.75 0 1 0 0 3.5 1.75 1.75 0 0 0 0-3.5Z"
      />
    </svg>
  );
}

export function Brand({ inverse = false, href = "/" }: { inverse?: boolean; href?: string }) {
  return (
    <a
      href={href}
      className={`-mx-1 inline-flex min-h-11 items-center gap-2 px-1 text-[16px] font-[700] tracking-[-0.035em] ${inverse ? "text-white" : "text-ink"}`}
      aria-label="Relay home"
    >
      <RelayMark inverse={inverse} />
      <span>Relay</span>
    </a>
  );
}
