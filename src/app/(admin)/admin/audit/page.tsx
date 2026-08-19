import { AdminInfiniteRecords } from "@/features/admin/admin-infinite-records";
import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminAuditLog } from "@/features/admin/queries";

export default async function AdminAuditPage() {
  const page = await getAdminAuditLog();

  return (
    <div>
      <AdminPageHeading
        title="Audit log"
        description="An append-only record of privileged production changes. Authentication secrets and payment details are never written here."
      />
      <AdminInfiniteRecords
        resource="audit"
        initialPage={page}
        emptyMessage="No privileged actions have been recorded."
      />
    </div>
  );
}
