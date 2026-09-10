import { ButtonLink } from "@/components/ui/button";
import { AdminInfiniteRecords } from "@/features/admin/admin-infinite-records";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { requireAdmin } from "@/features/admin/auth";
import { getAdminBillingRequests } from "@/features/billing/queries";

export default async function AdminBillingPage() {
  await requireAdmin();
  const page = await getAdminBillingRequests();
  return (
    <div>
      <AdminPageHeading
        title="Billing"
        description="Verify subscription payments against the actual receiving account. Game repayments are separate."
        action={
          <ButtonLink href="/admin/billing/settings" variant="secondary">
            Payment settings
          </ButtonLink>
        }
      />
      <nav
        aria-label="Billing navigation"
        className="mb-6 flex flex-wrap gap-3"
      >
        <ButtonLink href="/admin/billing/plans" variant="secondary">
          Plans & pricing
        </ButtonLink>
        <ButtonLink href="/admin/users" variant="secondary">
          Manage accounts
        </ButtonLink>
        <ButtonLink href="/pricing" variant="quiet">
          View public pricing
        </ButtonLink>
      </nav>
      <AdminInfiniteRecords
        resource="billing"
        initialPage={page}
        emptyMessage="No subscription payment requests."
      />
    </div>
  );
}
