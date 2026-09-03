import { ArrowClockwise } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/shared/brand";

export const metadata: Metadata = { title: "Relay is temporarily read-only" };

export default function ReadOnlyPage() {
  return (
    <main className="grid min-h-dvh place-items-center bg-canvas px-4 py-12">
      <section
        className="w-full max-w-lg rounded-xl border border-line bg-surface p-6 sm:p-8"
        aria-labelledby="title"
      >
        <Brand href="/" />
        <h1
          id="title"
          className="mt-8 text-[1.75rem] font-[680] leading-tight tracking-[-0.025em]"
        >
          Relay is temporarily read-only
        </h1>
        <p className="mt-3 text-[15px] leading-6 text-muted">
          You can still view games and court information, but changes are paused
          while we protect service availability. Your last action was not saved.
        </p>
        <Link
          href="/home"
          className="pressable mt-6 inline-flex min-h-10 items-center justify-center gap-2 rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover"
        >
          <ArrowClockwise aria-hidden size={17} /> Try again
        </Link>
      </section>
    </main>
  );
}
