import { requireUser } from "@/features/auth/session";
import { getOwnVenueChangeRequests } from "@/features/venues/change-request-queries";
import {
  getCourtListingBySlug,
  getCourtListings,
} from "@/features/venues/directory";
import { VenueSubmissionForm } from "@/features/venues/venue-submission-form";
import { VenueSubmissionHistory } from "@/features/venues/venue-submission-history";

export default async function SuggestCourtPage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string }>;
}) {
  const user = await requireUser("/court/suggest");
  const params = await searchParams;
  const [courts, initialVenue, submissions] = await Promise.all([
    getCourtListings(),
    params.court ? getCourtListingBySlug(params.court) : Promise.resolve(null),
    getOwnVenueChangeRequests(user.id),
  ]);
  return (
    <div className="w-full">
      <header className="mb-8 border-b border-line pb-7">
        <h1 className="app-title">Improve Court Finder</h1>
      </header>
      <div className="mx-auto w-full max-w-2xl space-y-12">
        <VenueSubmissionForm
          courts={courts}
          initialVenue={initialVenue ?? undefined}
        />
        <VenueSubmissionHistory submissions={submissions} />
      </div>
    </div>
  );
}
