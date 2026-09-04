import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Suspense } from "react";

import { AuthEntry, AuthEntryFallback } from "@/features/auth/auth-entry";
import { getCurrentUser } from "@/features/auth/session";

export const metadata: Metadata = { title: "Log in" };

export default async function LoginPage() {
  if (await getCurrentUser()) redirect("/home");

  return (
    <Suspense fallback={<AuthEntryFallback />}>
      <AuthEntry mode="signin" />
    </Suspense>
  );
}
