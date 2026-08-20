import { requireUser } from "@/features/auth/session";
import { VenueSubmissionForm } from "@/features/venues/venue-submission-form";

export default async function SuggestCourtPage() {
  await requireUser("/court/suggest");
  return (
    <div>
      <header className="mb-8 max-w-2xl border-b border-line pb-7">
        <h1 className="app-title">Suggest a court</h1>
        <p className="mt-2 text-pretty leading-6 text-muted">
          Know a court we missed? Send the basics. Relay will verify its location and public details before adding it to
          the map.
        </p>
      </header>
      <VenueSubmissionForm />
    </div>
  );
}
