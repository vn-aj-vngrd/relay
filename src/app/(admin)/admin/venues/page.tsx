import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { SelectField } from "@/components/ui/select-field";
import { AdminInfiniteRecords } from "@/features/admin/admin-infinite-records";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminVenues } from "@/features/admin/queries";

const statuses = ["", "pending", "unverified", "verified", "rejected", "archived"];

export default async function AdminVenuesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.slice(0, 100) ?? "";
  const status = params.status ?? "";
  const page = await getAdminVenues({ query, status });

  return (
    <div>
      <AdminPageHeading
        title="Venues"
        description="Verify Cebu court listings, review community submissions, and keep booking and map information accurate."
      />
      <form role="search" className="mb-5 flex max-w-3xl flex-col gap-2 sm:flex-row sm:items-center">
        <label className="relative flex-1">
          <span className="sr-only">Search venues</span>
          <MagnifyingGlass
            aria-hidden
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search court or address"
            className="field !mt-0 !h-10 !pl-10 text-sm"
          />
        </label>
        <SelectField
          id="admin-venue-status"
          name="status"
          label="Filter by status"
          hideLabel
          defaultValue={status}
          className="!mt-0 !h-10 min-w-40"
          options={statuses.map((value) => ({
            value,
            label: value ? value[0].toUpperCase() + value.slice(1) : "All statuses",
          }))}
        />
        <button className="pressable h-10 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover">
          Apply
        </button>
      </form>
      <AdminInfiniteRecords
        key={`venues:${query}:${status}`}
        resource="venues"
        initialPage={page}
        query={query}
        status={status}
        emptyMessage="No venues match these filters."
      />
    </div>
  );
}
