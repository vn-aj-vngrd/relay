import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthEntry, AuthEntryFallback } from "@/features/auth/auth-entry";

export const metadata: Metadata = { title: "Create your Relay account" };

export default function SignupPage() {
  return (
    <Suspense fallback={<AuthEntryFallback />}>
      <AuthEntry mode="create" />
    </Suspense>
  );
}
