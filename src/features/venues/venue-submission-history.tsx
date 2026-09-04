import { venueChangeRequestStatusLabels } from "./request-status";

export type VenueSubmissionHistoryItem = {
  id: string;
  requestType: "create" | "update";
  status: keyof typeof venueChangeRequestStatusLabels;
  name: string;
  resolutionNote: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export function VenueSubmissionHistory({
  submissions,
}: {
  submissions: VenueSubmissionHistoryItem[];
}) {
  return (
    <section id="your-suggestions" aria-labelledby="your-suggestions-title">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h2 id="your-suggestions-title" className="text-lg font-[680]">
            Your suggestions
          </h2>
          <p className="mt-1 text-sm leading-6 text-muted">
            Track what Relay is reviewing and what happened next.
          </p>
        </div>
        <span className="score text-sm text-muted">{submissions.length}</span>
      </div>

      {submissions.length ? (
        <ol className="mt-4 divide-y divide-line border-y border-line">
          {submissions.map((submission) => (
            <li
              key={submission.id}
              className="flex flex-col gap-2 py-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6"
            >
              <div className="min-w-0">
                <p className="font-semibold">{submission.name}</p>
                <p className="mt-1 text-xs text-muted">
                  {submission.requestType === "create"
                    ? "Missing court"
                    : "Listing update"}{" "}
                  ·{" "}
                  <time dateTime={submission.createdAt.toISOString()}>
                    {new Intl.DateTimeFormat("en-PH", {
                      dateStyle: "medium",
                      timeZone: "Asia/Manila",
                    }).format(submission.createdAt)}
                  </time>
                </p>
                {submission.resolutionNote ? (
                  <p className="mt-2 text-sm leading-6 text-muted">
                    {submission.resolutionNote}
                  </p>
                ) : null}
              </div>
              <span className="shrink-0 text-sm font-semibold text-ink">
                {venueChangeRequestStatusLabels[submission.status]}
              </span>
            </li>
          ))}
        </ol>
      ) : (
        <div className="mt-4 border-y border-line py-8">
          <p className="text-sm font-semibold">No suggestions sent yet</p>
          <p className="mt-1 text-sm text-muted">
            Submitted courts and corrections will appear here.
          </p>
        </div>
      )}
    </section>
  );
}
