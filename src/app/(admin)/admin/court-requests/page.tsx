import { ArrowRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminVenueChangeRequests } from "@/features/admin/queries";

export default async function AdminCourtRequestsPage() {
  const requests = await getAdminVenueChangeRequests();
  return (
    <div>
      <AdminPageHeading
        title="Court change requests"
        description="Review missing courts and proposed corrections before public Court Finder data changes."
      />
      {requests.length ? (
        <ul className="divide-y divide-line border-y border-line">
          {requests.map((request) => {
            const proposal = request.proposedChanges as Record<string, unknown>;
            const name = request.venueName ?? (typeof proposal.name === "string" ? proposal.name : "New court request");
            return (
              <li key={request.id}>
                <Link
                  href={`/admin/court-requests/${request.id}`}
                  className="pressable flex min-h-16 items-center gap-4 py-3 hover:bg-surface-strong/60 sm:px-3"
                >
                  <span className="min-w-0 flex-1">
                    <strong className="block truncate text-sm font-[650]">{name}</strong>
                    <span className="mt-1 block text-xs text-muted">
                      {request.requestType === "create" ? "Missing court" : "Listing update"} ·{" "}
                      {request.status.replaceAll("_", " ")} ·{" "}
                      {new Intl.DateTimeFormat("en-PH", { dateStyle: "medium", timeZone: "Asia/Manila" }).format(
                        request.createdAt,
                      )}
                    </span>
                  </span>
                  <ArrowRight aria-hidden className="shrink-0 text-muted" size={16} />
                </Link>
              </li>
            );
          })}
        </ul>
      ) : (
        <div className="border-y border-line py-10 text-center">
          <h2 className="font-[680]">No court changes to review</h2>
          <p className="mt-2 text-sm text-muted">New suggestions and corrections will appear here.</p>
        </div>
      )}
    </div>
  );
}
