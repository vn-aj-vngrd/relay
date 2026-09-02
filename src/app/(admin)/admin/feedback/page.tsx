import { MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";

import { SelectField } from "@/components/ui/select-field";
import { AdminInfiniteRecords } from "@/features/admin/admin-infinite-records";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { feedbackStatuses, feedbackStatusLabels, feedbackTypeLabels, feedbackTypes } from "@/features/feedback/domain";
import { getAdminFeedback } from "@/features/feedback/queries";

export default async function AdminFeedbackPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; type?: string; status?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.slice(0, 100) ?? "";
  const type = params.type ?? "";
  const status = params.status ?? "";
  const page = await getAdminFeedback({ query, type, status });

  return (
    <div>
      <AdminPageHeading
        title="Feedback"
        description="Review player reports and requests in one inbox. Status reflects triage—not a public delivery promise."
      />

      <section
        aria-label="Feedback totals"
        className="grid border-y border-line sm:grid-cols-5 sm:divide-x sm:divide-line"
      >
        {feedbackStatuses.map((value) => (
          <div
            key={value}
            className="flex items-center justify-between gap-3 border-t border-line py-3 first:border-t-0 sm:block sm:border-t-0 sm:px-4 sm:py-4 sm:first:pl-0"
          >
            <p className="text-sm font-medium text-muted">{feedbackStatusLabels[value]}</p>
            <p className="score text-xl font-bold sm:mt-2">{page.statusCounts[value] ?? 0}</p>
          </div>
        ))}
      </section>

      <form
        noValidate
        role="search"
        className="my-6 grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_180px_auto] sm:items-center"
      >
        <label className="relative">
          <span className="sr-only">Search feedback</span>
          <MagnifyingGlass
            aria-hidden
            size={18}
            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
          />
          <input
            type="search"
            name="q"
            defaultValue={query}
            placeholder="Search feedback or player"
            className="field !mt-0 !h-10 !pl-10 text-sm"
          />
        </label>
        <SelectField
          id="admin-feedback-type"
          name="type"
          label="Filter by type"
          hideLabel
          defaultValue={type}
          className="!mt-0 !h-10"
          options={[
            { value: "", label: "All types" },
            ...feedbackTypes.map((value) => ({ value, label: feedbackTypeLabels[value] })),
          ]}
        />
        <SelectField
          id="admin-feedback-status"
          name="status"
          label="Filter by status"
          hideLabel
          defaultValue={status}
          className="!mt-0 !h-10"
          options={[
            { value: "", label: "All statuses" },
            ...feedbackStatuses.map((value) => ({ value, label: feedbackStatusLabels[value] })),
          ]}
        />
        <button className="pressable h-10 rounded-lg bg-primary px-3.5 text-[13px] font-semibold text-white hover:bg-primary-hover">
          Apply
        </button>
      </form>

      <AdminInfiniteRecords
        key={`feedback:${query}:${type}:${status}`}
        resource="feedback"
        initialPage={{ items: page.items, nextCursor: page.nextCursor }}
        query={query}
        type={type}
        status={status}
        emptyMessage="No feedback matches these filters."
      />
    </div>
  );
}
