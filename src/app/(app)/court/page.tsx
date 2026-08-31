import { Plus, Question } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { CourtFinder } from "@/features/venues/court-finder";
import { getCourtListings } from "@/features/venues/directory";

export default async function CourtPage() {
  const courts = await getCourtListings();

  return (
    <div className="court-finder-workspace flex min-h-0 flex-col xl:h-full">
      <h1 className="sr-only sm:hidden">Court finder</h1>
      <header className="hidden shrink-0 items-end justify-between gap-3 sm:flex">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <h1 className="app-title">Find a court</h1>
            <IconTooltip
              id="court-coverage-tooltip"
              label="Court Finder covers the Philippines only. Listings are community-reviewed and growing; check current rates and hours before booking."
              align="center"
              side="bottom"
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
            Search by court, city, province, or neighborhood. Choose one for directions, booking details, or a new game.
          </p>
        </div>
        <ButtonLink
          href="/court/suggest"
          variant="secondary"
          aria-label="Suggest a court"
          className="h-11 w-11 shrink-0 px-0 sm:h-auto sm:w-auto sm:px-3"
        >
          <Plus aria-hidden size={16} /> <span className="hidden sm:inline">Suggest a court</span>
        </ButtonLink>
      </header>
      <CourtFinder
        venues={courts}
        isAuthenticated
        detailBasePath="/court"
        className="flex min-h-0 flex-1 flex-col sm:mt-7"
      />
    </div>
  );
}
