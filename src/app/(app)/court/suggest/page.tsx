import { requireUser } from "@/features/auth/session";
import { VenueSubmissionForm } from "@/features/venues/venue-submission-form";

export default async function SuggestCourtPage() {
  await requireUser("/court/suggest");
  return (
    <div>
      <header className="mb-8 max-w-2xl border-b border-line pb-7">
        <h1 className="app-title">Suggest a court</h1>
        <p className="mt-2 text-pretty leading-6 text-muted">
          Know a court we missed? Share its location, facilities, hours, pricing, and booking details. Relay will verify
          the information before adding it to the map.
        </p>
      </header>
      <VenueSubmissionForm />
    </div>
  );
}
