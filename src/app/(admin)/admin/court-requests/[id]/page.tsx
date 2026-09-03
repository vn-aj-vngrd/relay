import { ArrowSquareOut } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminVenueChangeRequest } from "@/features/admin/queries";
import { applyVenueChangeRequestAction, resolveVenueChangeRequestAction } from "@/features/venues/actions";
import { venueProposedChangesSchema } from "@/features/venues/change-requests";

function valueLabel(value: unknown) {
  if (value == null || value === "") return "Not listed";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) {
    if (!value.length) return "None listed";
    return value
      .map((item) =>
        typeof item === "object" && item ? Object.values(item as Record<string, unknown>).join(" · ") : String(item),
      )
      .join("; ");
  }
  return String(value).replaceAll("_", " ");
}

function fieldLabel(value: string) {
  return value.replace(/([A-Z])/g, " $1").replace(/^./, (letter) => letter.toUpperCase());
}

export default async function AdminCourtRequestPage({ params }: { params: Promise<{ id: string }> }) {
  const request = await getAdminVenueChangeRequest((await params).id);
  if (!request) notFound();
  const proposal = venueProposedChangesSchema.safeParse(request.proposedChanges);
  if (!proposal.success) throw new Error("This stored court request is invalid.");
  const resolved = ["approved", "rejected", "duplicate", "withdrawn"].includes(request.status);

  return (
    <div>
      <AdminPageHeading
        title={request.requestType === "create" ? "Missing court request" : "Court update request"}
        description={`${request.status.replaceAll("_", " ")} · submitted by ${request.submitter?.name ?? "Unknown player"}`}
        action={
          request.venue ? (
            <Link
              href={`/admin/courts/${request.venue.id}`}
              className="pressable inline-flex min-h-9 items-center rounded-lg border border-line px-3 text-[13px] font-semibold hover:bg-surface-strong"
            >
              Open court
            </Link>
          ) : undefined
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_320px]">
        <section>
          <h2 className="text-lg font-[680]">Proposed information</h2>
          <dl className="mt-4 divide-y divide-line border-y border-line">
            {Object.entries(proposal.data).map(([field, value]) => (
              <div key={field} className="grid gap-1 py-3 sm:grid-cols-[180px_minmax(0,1fr)] sm:gap-4">
                <dt className="text-sm font-semibold text-muted">{fieldLabel(field)}</dt>
                <dd className="break-words text-sm font-medium text-ink">{valueLabel(value)}</dd>
              </div>
            ))}
          </dl>
          {request.note ? (
            <div className="mt-6">
              <h2 className="text-sm font-[680]">Contributor note</h2>
              <p className="mt-2 whitespace-pre-wrap text-sm leading-6 text-muted">{request.note}</p>
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

          {!resolved ? (
            <>
              <form action={applyVenueChangeRequestAction} noValidate>
                <input type="hidden" name="requestId" value={request.id} />
                <button className="pressable min-h-10 w-full rounded-lg bg-primary px-4 text-sm font-semibold text-white hover:bg-primary-hover">
                  {request.requestType === "create"
                    ? request.venue
                      ? "Continue court review"
                      : "Create review draft"
                    : "Approve verified changes"}
                </button>
                {request.requestType === "create" ? (
                  <p className="mt-2 text-xs leading-5 text-muted">
                    Creates a private draft. Add an exact pin and finish verification in the court editor before
                    publishing.
                  </p>
                ) : null}
              </form>
              <form action={resolveVenueChangeRequestAction} className="space-y-3 border-t border-line pt-5" noValidate>
                <input type="hidden" name="requestId" value={request.id} />
                <label htmlFor="resolutionNote" className="text-sm font-semibold">
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
              <p className="font-[680] capitalize">{request.status.replaceAll("_", " ")}</p>
              {request.resolutionNote ? <p className="mt-2 leading-5 text-muted">{request.resolutionNote}</p> : null}
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
