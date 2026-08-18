import { redirect } from "next/navigation";

import { requireUser } from "@/features/auth/session";
import { ensureProfile } from "@/features/players/profile";

export default async function ProductTourPage() {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  if (!profile.onboardingCompletedAt) redirect("/onboarding");
  redirect("/home?tour=1");
}
