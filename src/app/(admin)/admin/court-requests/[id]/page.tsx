import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { AdminDate, AdminStatus } from "@/features/admin/presentation";
import { getAdminVenueChangeRequest } from "@/features/admin/queries";
import {
  applyVenueChangeRequestAction,
  resolveVenueChangeRequestAction,
} from "@/features/venues/actions";
import { venueProposedChangesSchema } from "@/features/venues/change-requests";

function valueLabel(value: unknown) {
  if (value == null || value === "") return "Not listed";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (!value.length) return "None listed";
    return value
      .map((item) =>
        typeof item === "object" && item
          ? Object.values(item as Record<string, unknown>).join(" · ")
          : String(item)
      )
      .join("; ");
  }
  return String(value).replaceAll("_", " ");
}

function fieldLabel(value: string) {
  return value
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (letter) => letter.toUpperCase());
}

export default async function AdminCourtRequestPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const request = await getAdminVenueChangeRequest((await params).id);
  if (!request) notFound();
  const proposal = venueProposedChangesSchema.safeParse(
    request.proposedChanges
  );
  if (!proposal.success)
    throw new Error("This stored court request is invalid.");
  const resolved = [
    "approved",
    "partially_approved",
    "rejected",
    "duplicate",
    "withdrawn",
  ].includes(request.status);
  const currentVenue = request.venue
    ? (request.venue as unknown as Record<string, unknown>)
    : null;

  return (
    <div>
      <AdminPageHeading
        title={
          request.requestType === "create"
            ? "Missing court request"
            : "Court update request"
        }
        description={`Submitted by ${request.submitter?.name ?? "Unknown player"}`}
        action={<AdminStatus value={request.status} />}
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-[680]">
                {request.requestType === "update"
                  ? "Current and proposed"
                  : "Proposed information"}
              </h2>
              <p className="mt-1 text-sm text-muted">
                {Object.keys(proposal.data).length} proposed fields
              </p>
            </div>
            <AdminDate value={request.createdAt} includeTime />
          </div>
          <div className="mt-4 overflow-x-auto border-y border-line">
            <table className="w-full min-w-[620px] border-collapse text-left">
              <thead>
                <tr className="border-b border-line text-xs font-semibold text-muted">
                  <th className="px-3 py-3">Field</th>
                  {request.requestType === "update" ? (
                    <th className="px-3 py-3">Current</th>
                  ) : null}
                  <th className="px-3 py-3">Proposed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {Object.entries(proposal.data).map(([field, value]) => (
                  <tr key={field} className="align-top">
                    <th className="px-3 py-4 text-sm font-semibold text-muted">
                      {fieldLabel(field)}
                    </th>
                    {request.requestType === "update" ? (
                      <td className="max-w-sm break-words px-3 py-4 text-sm leading-6 text-muted">
                        {valueLabel(currentVenue?.[field])}
                      </td>
                    ) : null}
                    <td className="max-w-sm break-words px-3 py-4 text-sm font-medium leading-6">
                      {valueLabel(value)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {request.note ? (
            <div className="mt-6">
              <h2 className="text-sm font-[680]">Contributor note</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">
                {request.note}
              </p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="border-y border-line py-5">
            <h2 className="text-sm font-[680]">Evidence</h2>
            <div className="mt-3 space-y-2">
              {request.evidenceUrls.map((url) => (
                <Link
                  key={url}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary-soft"
                >
                  Open submitted source <ArrowSquareOut aria-hidden size={15} />
                </Link>
              ))}
              {request.venue ? (
                <Link
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${request.venue.name} ${request.venue.address}`)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="pressable flex min-h-11 items-center justify-between gap-3 rounded-lg px-2 text-sm font-semibold text-primary hover:bg-primary-soft"
                >
                  Verify in Google Maps <ArrowSquareOut aria-hidden size={15} />
                </Link>
              ) : null}
            </div>
          </section>

          {request.relatedRequests.length ? (
            <section>
              <h2 className="text-sm font-[680]">
                Other open requests for this court
              </h2>
              <ul className="mt-3 divide-y divide-line border-y border-line">
                {request.relatedRequests.map((related) => (
                  <li key={related.id}>
                    <Link
                      href={`/admin/court-requests/${related.id}`}
                      className="pressable flex min-h-11 items-center justify-between gap-3 py-3 text-sm hover:bg-surface-strong sm:px-2"
                    >
                      <span className="font-semibold capitalize">
                        {related.status.replaceAll("_", " ")}
                      </span>
                      <AdminDate value={related.createdAt} />
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}

          {!resolved ? (
            <>
              <form action={applyVenueChangeRequestAction} noValidate>
                <input type="hidden" name="requestId" value={request.id} />
                <button className="pressable min-h-10 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
                  {request.requestType === "create"
                    ? request.venue
                      ? "Continue court review"
                      : "Create review draft"
                    : `Approve all ${Object.keys(proposal.data).length} fields`}
                </button>
                {request.requestType === "create" ? (
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Creates a private draft. Add an exact pin and finish
                    verification in the court editor before publishing.
                  </p>
                ) : null}
              </form>
              <form
                action={resolveVenueChangeRequestAction}
                className="space-y-3 border-t border-line pt-5"
                noValidate
              >
                <input type="hidden" name="requestId" value={request.id} />
                <label
                  htmlFor="resolutionNote"
                  className="text-sm font-semibold"
                >
                  Resolution note
                </label>
                <textarea
                  id="resolutionNote"
                  name="resolutionNote"
                  required
                  minLength={3}
                  maxLength={600}
                  rows={3}
                  className="field h-auto min-h-24 resize-y py-3"
                  placeholder="Why this request should not be applied…"
                />
                <div className="grid grid-cols-2 gap-2">
                  <button
                    name="decision"
                    value="duplicate"
                    className="pressable min-h-10 rounded-lg border border-line px-3 text-sm font-semibold hover:bg-surface-strong"
                  >
                    Duplicate
                  </button>
                  <button
                    name="decision"
                    value="rejected"
                    className="pressable min-h-10 rounded-lg border border-line px-3 text-sm font-semibold text-danger hover:bg-danger/8"
                  >
                    Reject
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="border-y border-line py-5 text-sm">
              <p className="font-[680] capitalize">
                {request.status.replaceAll("_", " ")}
              </p>
              {request.resolutionNote ? (
                <p className="mt-2 leading-5 text-muted">
                  {request.resolutionNote}
                </p>
              ) : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
