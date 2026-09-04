import type { Metadata } from "next";

import { requireUser } from "@/features/auth/session";
import { getOwnVenueChangeRequests } from "@/features/venues/change-request-queries";
import {
  getCourtListingBySlug,
  getCourtListings,
} from "@/features/venues/directory";
import { VenueSubmissionForm } from "@/features/venues/venue-submission-form";
import { VenueSubmissionHistory } from "@/features/venues/venue-submission-history";

export const metadata: Metadata = {
  title: "Suggest a court",
  description:
    "Share a missing court or request an update to an existing Relay Court Finder listing.",
  robots: { index: false, follow: false },
};

export default async function SuggestCourtPage({
  searchParams,
}: {
  searchParams: Promise<{ court?: string }>;
}) {
  const user = await requireUser("/courts/suggest");
  const params = await searchParams;
  const [courts, initialVenue, submissions] = await Promise.all([
    getCourtListings(),
    params.court ? getCourtListingBySlug(params.court) : Promise.resolve(null),
    getOwnVenueChangeRequests(user.id),
  ]);
  return (
    <div className="w-full">
      <header className="mb-8 border-b border-line pb-7">
        <h1 className="app-title">Suggest a court</h1>
        <p className="mt-2 text-sm text-muted">
          Share a missing court or request an update to an existing listing.
        </p>
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
