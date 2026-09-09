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
      <AdminInfiniteRecords
        resource="billing"
        initialPage={page}
        emptyMessage="No subscription payment requests."
      />
    </div>
  );
}
