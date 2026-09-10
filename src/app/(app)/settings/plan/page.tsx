import { Suspense } from "react";

import { AccountBilling } from "@/features/billing/account-billing";
import { BillingTabs } from "@/features/billing/billing-tabs";
import {
  type BillingPageQuery,
  billingSection,
} from "@/features/billing/navigation";

export default async function PlanPage({
  searchParams,
}: {
  searchParams: Promise<BillingPageQuery>;
}) {
  const query = await searchParams;
  const section = billingSection(query);
  const loadingLabel = {
    current: "Loading your plan and usage…",
    plans: "Loading available plans…",
    history: "Loading your plan and payment history…",
  }[section];

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="pb-6">
        <h1 className="app-title">Plan & billing</h1>
        <p className="mt-2 text-sm text-muted">
          Manage your hosting plan, compare options and review your history.
        </p>
      </header>
      <BillingTabs active={section} query={query} />
      <div className="py-6">
        <Suspense
          key={`${section}:${query.plan ?? ""}:${query.cursor ?? ""}:${query.terms ?? ""}`}
          fallback={
            <p role="status" className="py-6 text-sm text-muted">
              {loadingLabel}
            </p>
          }
        >
          <AccountBilling searchParams={Promise.resolve(query)} />
        </Suspense>
      </div>
    </div>
  );
}
