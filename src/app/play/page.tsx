import { ArrowRight, MapPin } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";
import Link from "next/link";

import { Brand } from "@/components/shared/brand";
import { PublicQuickPlay } from "@/features/matches/public-quick-play";

export const metadata: Metadata = {
  title: "Quick Play — Free pickleball scorekeeper",
  description:
    "Use a free pickleball scorekeeper and rotation manager in your browser. Add players, manage up to six courts, switch scoreboards, and keep score without an account.",
  alternates: { canonical: "/play" },
  openGraph: {
    title: "Free pickleball scorekeeper and rotation manager",
    description:
      "Add players, run court rotations, and keep score from one phone—no account required.",
    url: "/play",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Relay pickleball scorekeeper",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Free pickleball scorekeeper and rotation manager",
    description:
      "Add players, manage courts and rotations, and keep score from one phone.",
    images: ["/opengraph-image"],
  },
};

export default function QuickPlayPage() {
  return (
    <div className="flex min-h-dvh flex-col bg-canvas text-ink">
      <header className="app-chrome safe-top sticky top-0 z-30 border-b border-line">
        <div className="mx-auto flex h-16 w-full max-w-[1180px] items-center justify-between gap-3 px-4 sm:px-8">
          <Brand />
          <div className="flex items-center gap-1">
            <Link
              href="/courts"
              className="pressable hidden min-h-10 items-center gap-1.5 px-3 text-sm font-medium text-muted hover:text-ink sm:inline-flex"
            >
              <MapPin aria-hidden size={16} /> Find a court
            </Link>
            <Link
              href="/signup?next=%2Fgames%2Fnew"
              className="pressable inline-flex min-h-10 items-center gap-1.5 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover"
            >
              Plan a game <ArrowRight aria-hidden size={15} />
            </Link>
          </div>
        </div>
      </header>
      <main
        id="main-content"
        className="w-full flex-1 px-4 py-8 sm:px-8 sm:py-12"
      >
        <PublicQuickPlay />
      </main>
      <footer className="border-t border-line px-4 py-7 sm:px-8">
        <div className="mx-auto flex max-w-[1180px] flex-wrap items-center justify-between gap-4 text-sm text-muted">
          <p>Quick Play runs locally in your browser.</p>
          <nav aria-label="Quick Play footer" className="flex flex-wrap gap-5">
            <Link href="/courts" className="hover:text-ink">
              Philippines courts
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
            <Link href="/terms" className="hover:text-ink">
              Terms
            </Link>
          </nav>
        </div>
      </footer>
    </div>
  );
}
