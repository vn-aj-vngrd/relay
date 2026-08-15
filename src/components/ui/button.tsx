import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover border-transparent",
  secondary: "bg-canvas text-ink hover:bg-surface border-line",
  quiet: "bg-transparent text-ink hover:bg-surface border-transparent",
  danger: "bg-danger text-white hover:opacity-90 border-transparent",
};

const base = "pressable inline-flex min-h-11 items-center justify-center gap-2 rounded-[10px] border px-4 text-sm font-semibold disabled:pointer-events-none disabled:opacity-45";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ href, children, variant = "primary", className = "", ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string; children: ReactNode; variant?: Variant }) {
  return <Link href={href} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</Link>;
}
