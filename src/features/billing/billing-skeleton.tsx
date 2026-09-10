import { RowsSkeleton, Skeleton } from "@/components/shared/skeleton";

import type { BillingSection } from "./navigation";

const loadingLabels = {
  current: "Loading your plan and usage…",
  plans: "Loading available plans…",
  history: "Loading your plan and payment history…",
};

export function BillingSkeleton({ section }: { section: BillingSection }) {
  return (
    <div role="status" aria-label={loadingLabels[section]}>
      <span className="sr-only">{loadingLabels[section]}</span>
      <div aria-hidden>
        {section === "current" ? (
          <div>
            <div className="flex min-h-9 items-center justify-between gap-3">
              <Skeleton className="h-6 w-36" />
              <Skeleton className="h-9 w-24" />
            </div>
            <div className="mt-4 divide-y divide-line border-y border-line">
              {["games", "storage", "reset"].map((row) => (
                <div
                  key={row}
                  className="flex flex-wrap items-start justify-between gap-4 py-4"
                >
                  <Skeleton className="h-4 w-48 max-w-full" />
                  <div className="flex w-40 flex-col items-end gap-2 sm:w-52">
                    <Skeleton className="h-4 w-32" />
                    {row !== "reset" ? (
                      <Skeleton className="h-1.5 w-full" />
                    ) : null}
                    {row === "storage" ? (
                      <Skeleton className="h-9 w-28" />
                    ) : null}
                  </div>
                </div>
              ))}
            </div>
            <p className="mt-3 text-sm leading-6 text-muted">
              Chat images and game photos share your total storage. Storage does
              not reset monthly.
            </p>
          </div>
        ) : section === "plans" ? (
          <section>
            <h2 className="text-lg font-semibold">Monthly hosting plans</h2>
            <p className="mb-4 mt-2 text-sm leading-6 text-muted">
              More games per month and more room for photos. Your players don’t
              need a paid plan. Paid renewal is manual, with no automatic
              charges.
            </p>
            <div className="grid gap-4 md:grid-cols-[repeat(auto-fit,minmax(220px,1fr))]">
              {["first", "second", "third"].map((card) => (
                <div
                  key={card}
                  className="flex min-w-0 flex-col rounded-xl border border-line bg-surface p-6"
                >
                  <div className="flex items-center justify-between gap-3">
                    <Skeleton className="h-6 w-16" />
                    <Skeleton className="h-6 w-24" />
                  </div>
                  <Skeleton className="mt-3 h-12 w-full" />
                  <Skeleton className="mt-6 h-10 w-32" />
                  <Skeleton className="mt-2 h-4 w-40 max-w-full" />
                  <div className="my-6 space-y-3">
                    {["games", "storage", "features", "players"].map((line) => (
                      <Skeleton key={line} className="h-4 w-full" />
                    ))}
                  </div>
                  <Skeleton className="mt-auto h-9 w-full" />
                </div>
              ))}
            </div>
          </section>
        ) : (
          <div className="flex flex-col gap-8">
            <section>
              <h2 className="text-lg font-semibold">Plan history</h2>
              <p className="mb-4 mt-2 text-sm text-muted">
                Paid and complimentary terms, plus your latest admin plan
                assignment.
              </p>
              <RowsSkeleton />
            </section>
            <section className="border-t border-line pt-6">
              <h2 className="mb-4 text-lg font-semibold">Payment history</h2>
              <RowsSkeleton />
            </section>
          </div>
        )}
      </div>
    </div>
  );
}
