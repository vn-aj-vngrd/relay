import type { Metadata } from "next";
import { Suspense } from "react";

import { AuthEntry, AuthEntryFallback } from "@/features/auth/auth-entry";

export const metadata: Metadata = { title: "Log in" };

export default function LoginPage() {
  return (
    <Suspense fallback={<AuthEntryFallback />}>
      <AuthEntry mode="signin" />
    </Suspense>
  );
}
