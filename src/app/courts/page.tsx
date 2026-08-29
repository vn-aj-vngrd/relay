import { Plus, Question } from "@phosphor-icons/react/dist/ssr";
import type { Metadata } from "next";

import { ButtonLink } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { getCurrentUser } from "@/features/auth/session";
import { CourtFinder } from "@/features/venues/court-finder";
import { getCebuVenues } from "@/features/venues/queries";

export const metadata: Metadata = {
  title: "Pickleball courts in Cebu",
  description: "Find pickleball courts in Cebu. Check the location, setting, price, and booking link.",
};

export default async function CourtPage() {
  const [courts, user] = await Promise.all([getCebuVenues(), getCurrentUser()]);
  const suggestHref = user ? "/court/suggest" : `/signup?next=${encodeURIComponent("/court/suggest")}`;

  return (
    <div>
      <header className="flex items-center justify-between gap-3 sm:items-end">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <h1 className="app-title">
              <span className="sm:hidden">Find a court</span>
              <span className="hidden sm:inline">Find a pickleball court in Cebu</span>
            </h1>
            <IconTooltip
              id="court-coverage-tooltip"
              label="Court Finder covers Cebu. Check current rates and hours before booking."
              align="center"
            >
              <button
                type="button"
                aria-label="About court coverage"
                aria-describedby="court-coverage-tooltip"
                className="pressable grid h-9 w-9 place-items-center rounded-md text-muted hover:bg-surface-strong hover:text-ink"
              >
                <Question aria-hidden size={17} weight="bold" />
              </button>
            </IconTooltip>
          </div>
          <p className="mt-2 hidden max-w-xl text-pretty leading-6 text-muted sm:block">
            Search by court or neighborhood. Choose one for directions, booking details, or a new game.
          </p>
        </div>
        <ButtonLink
          href={suggestHref}
          variant="secondary"
          aria-label="Suggest a court"
          className="h-11 w-11 shrink-0 px-0 sm:h-auto sm:w-auto sm:px-3"
        >
          <Plus aria-hidden size={16} /> <span className="hidden sm:inline">Suggest a court</span>
        </ButtonLink>
      </header>
      <CourtFinder venues={courts} isAuthenticated={Boolean(user)} detailBasePath="/courts" />
    </div>
  );
}
