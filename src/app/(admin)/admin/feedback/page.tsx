import { ArrowRight, MagnifyingGlass } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { SelectField } from "@/components/ui/select-field";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { AdminDate } from "@/features/admin/presentation";
import {
  type FeedbackArea,
  feedbackAreaLabels,
  feedbackStatuses,
  feedbackStatusLabels,
  feedbackTypeLabels,
  feedbackTypes,
} from "@/features/feedback/domain";
import { FeedbackStatusBadge } from "@/features/feedback/feedback-status";
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
  const data = await getAdminFeedback({ query, type, status });
  const grouped = feedbackStatuses
    .map((groupStatus) => ({
      status: groupStatus,
      items: data.items.filter((item) => item.status === groupStatus),
    }))
    .filter((group) => group.items.length);

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
            <p className="score text-xl font-bold sm:mt-2">{data.statusCounts[value] ?? 0}</p>
          </div>
        ))}
      </section>

      <form role="search" className="my-6 grid gap-2 sm:grid-cols-[minmax(220px,1fr)_180px_180px_auto] sm:items-center">
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

      {grouped.length ? (
        <div className="space-y-8">
          {grouped.map((group) => (
            <section key={group.status} aria-labelledby={`feedback-${group.status}`}>
              <div className="flex items-center justify-between gap-4">
                <h2 id={`feedback-${group.status}`} className="text-base font-bold">
                  {feedbackStatusLabels[group.status]}
                </h2>
                <span className="score text-xs text-muted">{group.items.length}</span>
              </div>
              <ol className="mt-2 divide-y divide-line border-y border-line">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      href={`/admin/feedback/${item.id}`}
                      className="pressable flex min-h-20 items-center gap-4 py-4 hover:bg-surface-strong sm:px-2"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="font-semibold">{item.title}</p>
                          <span className="text-xs font-semibold text-muted">{feedbackTypeLabels[item.type]}</span>
                        </div>
                        <p className="mt-1 truncate text-sm text-muted">
                          {feedbackAreaLabels[item.area as FeedbackArea]} · {item.submitterName ?? item.submitterEmail}
                        </p>
                        <div className="mt-2 sm:hidden">
                          <FeedbackStatusBadge status={item.status} />
                        </div>
                      </div>
                      <div className="hidden text-right sm:block">
                        <AdminDate value={item.createdAt} />
                        <p className="mt-1 text-xs text-muted">{item.submitterEmail}</p>
                      </div>
                      <ArrowRight aria-hidden size={17} className="shrink-0 text-muted" />
                    </Link>
                  </li>
                ))}
              </ol>
            </section>
          ))}
        </div>
      ) : (
        <div className="border-y border-line py-10 text-center">
          <p className="text-sm font-semibold">No feedback matches these filters</p>
          <p className="mt-1 text-sm text-muted">Clear a filter or try a shorter search.</p>
        </div>
      )}
    </div>
  );
}
