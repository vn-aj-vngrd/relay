import { Plus, Question } from "@phosphor-icons/react/dist/ssr";

import { ButtonLink } from "@/components/ui/button";
import { IconTooltip } from "@/components/ui/icon-tooltip";
import { CourtFinder } from "@/features/venues/court-finder";
import { getCebuVenues } from "@/features/venues/queries";

export default async function CourtPage() {
  const courts = await getCebuVenues();

  return (
    <div className="court-finder-workspace flex min-h-0 flex-col xl:h-full">
      <header className="shrink-0 flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div className="max-w-2xl">
          <div className="flex items-center gap-2">
            <h1 className="app-title">Find a court</h1>
            <IconTooltip
              id="court-coverage-tooltip"
              label="Court Finder covers Cebu. Check current rates and hours before booking."
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
          <p className="mt-2 max-w-xl text-pretty leading-6 text-muted">
            Search by court or neighborhood. Choose one for directions, booking details, or a new game.
          </p>
        </div>
        <ButtonLink href="/court/suggest" variant="secondary" className="w-fit">
          <Plus aria-hidden size={16} /> Suggest a court
        </ButtonLink>
      </header>
      <CourtFinder
        venues={courts}
        isAuthenticated
        detailBasePath="/court"
        className="mt-7 flex min-h-0 flex-1 flex-col"
      />
    </div>
  );
}
