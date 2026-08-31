import Link from "next/link";

import { CourtFinder } from "@/features/venues/court-finder";
import type { CourtListing } from "@/features/venues/directory";

export function CourtFinderShowcase({ courts }: { courts: CourtListing[] }) {
  return (
    <section id="court-finder" className="border-b border-line bg-surface px-5 py-20 sm:px-8 sm:py-28">
      <div className="mx-auto max-w-[1180px]">
        <div data-marketing-reveal="split" className="grid items-end gap-8 lg:grid-cols-[.9fr_1.1fr]">
          <div>
            <p className="text-sm font-semibold text-marketing-accent">Philippines Court Finder</p>
            <h2 className="mt-4 max-w-xl text-3xl font-[620] tracking-[-0.038em] sm:text-5xl">
              Find a court across the Philippines.
            </h2>
          </div>
          <div className="lg:justify-self-end">
            <p className="max-w-xl text-base leading-7 text-muted">
              Search by court, city, province, or neighborhood. Check the setting, price, distance, directions, and
              booking link, then pick a court to start a game.
            </p>
            <Link
              href="/courts"
              className="pressable mt-5 inline-flex min-h-10 items-center justify-center rounded-lg border border-transparent bg-primary px-4 text-[13px] font-semibold text-white shadow-[inset_0_1px_0_oklch(1_0_0/.22)] hover:bg-primary-hover"
            >
              Find a court
            </Link>
          </div>
        </div>

        <div className="mt-12 rounded-xl border border-line bg-surface p-4 text-ink shadow-[0_8px_8px_rgb(20_24_34_/_0.08)] sm:p-6">
          <CourtFinder
            venues={courts}
            isAuthenticated={false}
            detailBasePath="/courts"
            showFilterTopBorder={false}
            compactPreview
            autoLoadMap
            className="mt-0"
          />
        </div>
        <p className="mt-3 text-xs leading-5 text-muted">
          Court Finder covers the Philippines only. These are representative listings from the reviewed directory;
          confirm current rates and hours before booking.
        </p>
      </div>
    </section>
  );
}
