import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { SelectField } from "@/components/ui/select-field";
import { AdminInfiniteRecords } from "@/features/admin/admin-infinite-records";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminVenueChangeRequests } from "@/features/admin/queries";
import {
  openVenueChangeRequestStatuses,
  venueChangeRequestStatuses,
  venueChangeRequestStatusLabels,
} from "@/features/venues/request-status";

export default async function AdminCourtRequestsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; type?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.slice(0, 100) ?? "";
  const status = params.status ?? "open";
  const type = params.type ?? "";
  const page = await getAdminVenueChangeRequests({ query, status, type });
  const openCount = openVenueChangeRequestStatuses.reduce(
    (total, value) => total + (page.statusCounts[value] ?? 0),
    0
  );

  return (
    <div>
      <AdminPageHeading
        title="Court change requests"
        description="Verify evidence before public Court Finder data changes. Oldest unresolved requests appear first."
      />
      <section
        aria-label="Court request workload"
        className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-2 border-y border-line py-4 text-sm"
      >
        <p>
          <strong className="score mr-1.5 text-lg">{openCount}</strong>
          <span className="text-muted">awaiting a decision</span>
        </p>
        <p className="text-muted">
          {page.statusCounts.needs_info ?? 0} need information ·{" "}
          {page.statusCounts.in_review ?? 0} in review
        </p>
      </section>
      <form
        noValidate
        role="search"
        className="mb-5 grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_180px_auto] sm:items-center"
      >
        <label className="relative">
          <span className="sr-only">Search court requests</span>
          <MagnifyingGlass
            aria-hidden
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search court, place, or player"
            className="field !mt-0 !h-10 !pl-10 text-sm"
          />
        </label>
        <SelectField
          id="admin-court-request-status"
          name="status"
          label="Filter by status"
          hideLabel
          defaultValue={status}
          className="!mt-0 !h-10"
          options={[
            { value: "open", label: `Needs review (${openCount})` },
            { value: "", label: "All statuses" },
            ...venueChangeRequestStatuses.map((value) => ({
              value,
              label: `${venueChangeRequestStatusLabels[value]} (${page.statusCounts[value] ?? 0})`,
            })),
          ]}
        />
        <SelectField
          id="admin-court-request-type"
          name="type"
          label="Filter by request type"
          hideLabel
          defaultValue={type}
          className="!mt-0 !h-10"
          options={[
            { value: "", label: "All request types" },
            { value: "update", label: "Listing updates" },
            { value: "create", label: "Missing courts" },
          ]}
        />
        <button className="pressable h-10 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover">
          Apply
        </button>
      </form>
      <AdminInfiniteRecords
        key={`court-requests:${query}:${status}:${type}`}
        resource="court-requests"
        initialPage={{ items: page.items, nextCursor: page.nextCursor }}
        query={query}
        status={status}
        type={type}
        emptyMessage="No court requests match these filters."
      />
    </div>
  );
}
