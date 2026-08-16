import Link from "next/link";
import type { ComponentProps, ReactNode } from "react";

type Variant = "primary" | "secondary" | "quiet" | "danger";
type Size = "default" | "large";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-white hover:bg-primary-hover border-transparent shadow-[inset_0_1px_0_oklch(1_0_0/.22)]",
  secondary: "bg-surface text-ink hover:bg-surface-strong border-line",
  quiet: "bg-transparent text-ink hover:bg-surface-strong border-transparent",
  danger: "bg-danger text-white hover:opacity-90 border-transparent shadow-[inset_0_1px_0_oklch(1_0_0/.18)]",
};

const sizes: Record<Size, string> = {
  default: "min-h-9 px-3",
  large: "min-h-10 px-3.5",
};

const base = "pressable inline-flex items-center justify-center gap-1.5 rounded-lg border text-[13px] font-[600] disabled:pointer-events-none disabled:opacity-45";

export function ButtonSpinner({ className = "" }: { className?: string }) {
  return <span aria-hidden="true" className={`h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-r-transparent ${className}`} />;
}

export function Button({ variant = "primary", size = "default", className = "", ...props }: ComponentProps<"button"> & { variant?: Variant; size?: Size }) {
  return <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props} />;
}

export function ButtonLink({ href, children, variant = "primary", size = "default", className = "", ...props }: Omit<ComponentProps<typeof Link>, "href"> & { href: string; children: ReactNode; variant?: Variant; size?: Size }) {
  return <Link href={href} prefetch={false} className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...props}>{children}</Link>;
}
