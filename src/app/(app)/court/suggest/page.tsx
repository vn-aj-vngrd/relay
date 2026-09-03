import { requireUser } from "@/features/auth/session";
import {
  getCourtListingBySlug,
  getCourtListings,
} from "@/features/venues/directory";
import { VenueSubmissionForm } from "@/features/venues/venue-submission-form";

export default async function SuggestCourtPage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string }>;
}) {
  await requireUser("/court/suggest");
  const params = await searchParams;
  const [courts, initialVenue] = await Promise.all([
    getCourtListings(),
    params.court ? getCourtListingBySlug(params.court) : Promise.resolve(null),
  ]);
  return (
    <div>
      <header className="mb-8 max-w-2xl border-b border-line pb-7">
        <h1 className="app-title">Improve Court Finder</h1>
        <p className="mt-2 text-pretty leading-6 text-muted">
          Add a missing court or suggest a correction to an existing listing.
          Relay reviews every source before public information changes.
        </p>
      </header>
      <VenueSubmissionForm
        courts={courts}
        initialVenue={initialVenue ?? undefined}
      />
    </div>
  );
}
