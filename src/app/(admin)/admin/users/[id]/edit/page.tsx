import { ArrowLeft } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { notFound } from "next/navigation";
import { z } from "zod";

import { AdminPageHeading } from "@/features/admin/admin-page-heading";
import { getAdminUser } from "@/features/admin/queries";
import { UpdateUserForm } from "@/features/admin/update-user-form";

export default async function EditAdminUserPage({ params }: { params: Promise<{ id: string }> }) {
  const parsed = z.uuid().safeParse((await params).id);
  if (!parsed.success) notFound();
  const account = await getAdminUser(parsed.data);
  if (!account) notFound();

  return (
    <div>
      <Link
        href={`/admin/users/${account.user.id}`}
        className="mb-5 inline-flex min-h-10 items-center gap-2 text-sm font-semibold text-muted hover:text-ink"
      >
        <ArrowLeft aria-hidden size={16} />
        Account details
      </Link>
      <AdminPageHeading
        title="Edit profile"
        description={`Update the public player details for ${account.user.email}. Authentication access is managed separately.`}
      />
      <UpdateUserForm userId={account.user.id} profile={account.profile} />
    </div>
  );
}
