import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { CreateUserForm } from "@/features/admin/create-user-form";

export default function NewAdminUserPage() {
  return (
    <div>
      <Link
        href="/admin/users"
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} />
        All users
      </Link>
      <AdminPageHeading
        title="Create user"
        description="Create a confirmed Relay account and securely share its one-time temporary password with the player."
      />
      <CreateUserForm />
    </div>
  );
}
