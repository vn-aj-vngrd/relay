import type { Metadata } from "next";
import { redirect } from "next/navigation";

import { AuthenticatedAppShell } from "@/components/shared/authenticated-app-shell";
import { requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";

export const metadata: Metadata = { robots: { index: false, follow: false } };

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  if (!profile.onboardingCompletedAt) redirect("/onboarding");
  return <AuthenticatedAppShell user={user}>{children}</AuthenticatedAppShell>;
}
