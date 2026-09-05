import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { eq } from "drizzle-orm";

import { AuthenticatedAppShell } from "@/components/shared/authenticated-app-shell";
import { PublicProductShell } from "@/components/shared/public-product-shell";
import { db } from "@/db/client";
import { profiles } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export default async function HelpLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();
  // A missing session is expected on public Help. Provider failures are not
  // evidence that a signed-in reader has become anonymous.
  if (error && !isAuthSessionMissingError(error)) throw error;
  if (!data.user) return <PublicProductShell>{children}</PublicProductShell>;

  const user = await requireUser("/help");
  const profile = await db.query.profiles.findFirst({
    columns: { onboardingCompletedAt: true },
    where: eq(profiles.userId, user.id),
  });
  // Recovery must not create a profile or redirect an unfinished one to setup.
  if (!profile?.onboardingCompletedAt)
    return <PublicProductShell>{children}</PublicProductShell>;

  return (
    <AuthenticatedAppShell user={user} showApplicationTour={false}>
      {children}
    </AuthenticatedAppShell>
  );
}
