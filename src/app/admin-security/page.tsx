import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { Brand } from "@/components/shared/brand";
import { AdminMfaSetup } from "@/features/admin/admin-mfa-setup";
import { getAuthorizedAdmin } from "@/features/admin/auth";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Secure admin access" };

export default async function AdminSecurityPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?next=/admin");
  if (!(await getAuthorizedAdmin())) redirect("/admin-access-denied");

  return (
    <main className="min-h-dvh bg-canvas px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        <Brand href="/" />
        <div className="mt-8">
          <AdminMfaSetup />
        </div>
      </div>
    </main>
  );
}
