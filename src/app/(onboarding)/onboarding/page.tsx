import { redirect } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireUser } from "@/features/auth/session";
import { SetupWizard } from "@/features/onboarding/setup-wizard";
import { ensureProfile } from "@/features/players/profile";

export default async function OnboardingPage() {
  const user = await requireUser();
  const profile = await ensureProfile(user);
  if (profile.onboardingCompletedAt) redirect(profile.productTourCompletedAt ? "/home" : "/onboarding/tour");

  return <main id="main-content" className="min-h-screen bg-canvas">
    <header className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8"><Brand /><ThemeToggle /></header>
    <section className="mx-auto flex max-w-[1180px] justify-center px-5 pb-16 pt-7 sm:px-8 sm:pt-14"><SetupWizard initial={{ name: profile.name, username: profile.username, city: profile.city ?? "", skillLevel: profile.skillLevel ?? "", dominantHand: profile.dominantHand ?? "" }} /></section>
  </main>;
}
