import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover border-transparent shadow-[inset_0_1px_0_oklch(1_0_0/.22)]",
  secondary: "bg-surface text-ink hover:bg-surface-strong border-line",
  quiet: "bg-transparent text-ink hover:bg-surface-strong border-transparent",
  danger: "bg-danger text-white hover:opacity-90 border-transparent shadow-[inset_0_1px_0_oklch(1_0_0/.18)]",
};

const base = "pressable inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-3.5 text-sm font-[600] disabled:pointer-events-none disabled:opacity-45";

export function Button({ variant = "primary", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant }) {
  return <button className={`${base} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ href, children, variant = "primary", className = "", ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string; children: ReactNode; variant?: Variant }) {
  return <Link href={href} prefetch={false} className={`${base} ${variants[variant]} ${className}`} {...props}>{children}</Link>;
}
