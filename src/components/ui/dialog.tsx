import { type ComponentPropsWithoutRef, forwardRef } from "react";

const dialogVariants = {
  standard:
    "m-auto w-[calc(100%_-_2rem)] max-w-md rounded-xl border border-line bg-surface p-0 text-ink shadow-[0_8px_8px_oklch(0.1_0.01_275/.18)] backdrop:bg-black/45",
  media:
    "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100vw-2rem)] max-w-6xl overflow-visible border-0 bg-transparent p-0 text-white backdrop:bg-black/75",
  fullscreen:
    "m-auto h-dvh max-h-none w-screen max-w-none overflow-hidden border-0 bg-surface p-0 text-ink backdrop:bg-black/70",
} as const;

type DialogProps = ComponentPropsWithoutRef<"dialog"> & {
  variant?: keyof typeof dialogVariants;
};

export const Dialog = forwardRef<HTMLDialogElement, DialogProps>(function Dialog(
  { className = "", variant = "standard", ...props },
  ref,
) {
  return <dialog ref={ref} className={`relay-dialog ${dialogVariants[variant]} ${className}`} {...props} />;
});
