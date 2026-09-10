import { ButtonLink } from "@/components/ui/button";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { getAdminBillingOffer } from "@/features/billing/catalog";
import { BillingPlanForm } from "@/features/billing/forms";
import {
  pricingStatus,
  pricingStorage,
} from "@/features/billing/pricing-catalog";

export default async function BillingPlansPage() {
  await requireAdmin();
  const { catalog, acceptingPayments } = await getAdminBillingOffer();
  return (
    <div>
      <AdminPageHeading
        title="Plans & pricing"
        description="Manage monthly prices, monthly game allowances, total photo storage and launch availability. Every published change is versioned and audited."
        action={
          <ButtonLink href="/pricing" variant="secondary">
            View public pricing
          </ButtonLink>
        }
      />
      <nav
        aria-label="Billing navigation"
        className="mb-8 flex flex-wrap gap-3"
      >
        <ButtonLink href="/admin/billing" variant="secondary">
          Payment requests
        </ButtonLink>
        <ButtonLink href="/admin/billing/settings" variant="secondary">
          Payment settings
        </ButtonLink>
        <ButtonLink href="/admin/users" variant="secondary">
          Manage accounts
        </ButtonLink>
      </nav>
      <p className="mb-6 max-w-3xl text-sm leading-6 text-muted">
        {acceptingPayments
          ? "Payment collection is enabled. Only plans marked Active can be purchased."
          : "New purchases are disabled. Complete and enable Payment settings before activating a paid plan."}{" "}
        Coming soon and Paused never remove existing access. Complimentary
        grants and account overrides remain available from each user’s billing
        page.
      </p>
      <div className="divide-y divide-line border-y border-line">
        {catalog.map((plan) => (
          <details key={plan.version} className="py-5">
            <summary className="cursor-pointer py-2">
              <span className="font-semibold">
                {plan.name}
                {plan.id !== "unlimited"
                  ? ` · ₱${plan.priceCents / 100}/month`
                  : " · Admin only"}
              </span>
              <span className="mt-2 block text-sm text-muted">
                {plan.id === "unlimited"
                  ? "No hosting quotas"
                  : `${plan.games} games per month · ${pricingStorage(plan.storageBytes)} total photos`}{" "}
                · {plan.visible ? "Public" : "Hidden"} ·{" "}
                {plan.id === "unlimited"
                  ? "Assignable by admins"
                  : pricingStatus(plan, acceptingPayments)}
              </span>
            </summary>
            <div className="pt-5">
              <BillingPlanForm plan={plan} />
            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
