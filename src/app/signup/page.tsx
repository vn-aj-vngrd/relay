import type { Metadata } from "next";
import { cookies } from "next/headers";
import { Suspense } from "react";

import { AuthEntry, AuthEntryFallback } from "@/features/auth/auth-entry";

export const metadata: Metadata = { title: "Create your Relay account" };

export default async function SignupPage() {
  const cookieStore = await cookies();
  const confirmationEmail = cookieStore.get("relay_confirmation_email")?.value;

  return (
    <Suspense fallback={<AuthEntryFallback />}>
      <AuthEntry mode="create" confirmationEmail={confirmationEmail} />
    </Suspense>
  );
}
