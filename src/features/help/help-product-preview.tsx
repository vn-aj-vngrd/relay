import {
  CreateProductPreview,
  LivePlayProductPreview,
  PaymentsProductPreview,
  PlaySetupProductPreview,
} from "@/features/marketing/product-previews";
import { CourtFinder } from "@/features/venues/court-finder";
import type { CebuVenue } from "@/features/venues/queries";

function CourtFinderPreview({ courts }: { courts: CebuVenue[] }) {
  return (
    <figure>
      <div
        inert
        className="overflow-hidden rounded-xl border border-line bg-canvas p-3 text-left text-ink sm:p-5 [--primary:#5962d9]"
      >
        <CourtFinder
          venues={courts}
          isAuthenticated
          detailBasePath="/court"
          showFilterTopBorder={false}
          compactPreview
          className="mt-0"
        />
      </div>
      <figcaption className="mt-3 flex flex-wrap items-center justify-between gap-2 text-xs leading-5 text-muted">
        <span className="inline-flex items-center gap-2">
          <span className="h-1.5 w-1.5 rounded-full bg-signal" />
          The actual Court Finder component
        </span>
        <span>Current verified Cebu listings</span>
      </figcaption>
    </figure>
  );
}

export function HelpProductPreview({ guideId, courts }: { guideId: string; courts: CebuVenue[] }) {
  return (
    <div className="mt-7">
      {guideId === "find-a-court" ? <CourtFinderPreview courts={courts} /> : null}
      {guideId === "create-a-game" ? <CreateProductPreview /> : null}
      {guideId === "payments" ? <PaymentsProductPreview /> : null}
      {guideId === "choose-a-play-mode" ? <PlaySetupProductPreview /> : null}
      {guideId === "run-live-play" ? <LivePlayProductPreview /> : null}
    </div>
  );
}
