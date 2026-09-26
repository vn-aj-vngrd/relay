export const metadata = { title: "Your plan" };

import Link from "next/link";
import { Suspense } from "react";

import { AccountBilling } from "@/features/billing/account-billing";
import { BillingSkeleton } from "@/features/billing/billing-skeleton";
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

  return (
    <div className="mx-auto w-full max-w-6xl">
      <header className="pb-2 lg:pb-6">
        <h1 className="app-title hidden lg:block">Plan & billing</h1>
        <p className="mt-2 hidden text-sm text-muted lg:block">
          Manage your hosting plan, compare options and review your history.
        </p>
        <Link
          href="/help/subscription-payments"
          className="inline-flex min-h-11 items-center text-sm text-primary hover:underline lg:mt-2"
        >
          How to pay for a Relay subscription
        </Link>
      </header>
      <BillingTabs active={section} query={query} />
      <div className="py-6">
        <Suspense
          key={`${section}:${query.plan ?? ""}:${query.cursor ?? ""}:${query.terms ?? ""}`}
          fallback={<BillingSkeleton section={section} />}
        >
          <AccountBilling searchParams={Promise.resolve(query)} />
        </Suspense>
      </div>
    </div>
  );
}
