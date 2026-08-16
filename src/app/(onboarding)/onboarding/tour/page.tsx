import { redirect } from "next/navigation";
import { Brand } from "@/components/shared/brand";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { requireUser } from "@/features/auth/session";
import { ProductTour } from "@/features/onboarding/product-tour";
import { ensureProfile } from "@/features/players/profile";

export default async function ProductTourPage({ searchParams }: { searchParams: Promise<{ replay?: string }> }) {
  const user = await requireUser();
  const [profile, query] = await Promise.all([ensureProfile(user), searchParams]);
  const replay = query.replay === "1";
  if (!profile.onboardingCompletedAt) redirect("/onboarding");
  if (profile.productTourCompletedAt && !replay) redirect("/home");

  return <main id="main-content" className="min-h-screen bg-canvas">
    <header className="mx-auto flex h-16 max-w-[1180px] items-center justify-between px-5 sm:px-8"><Brand /><ThemeToggle /></header>
    <section className="mx-auto flex max-w-[1180px] justify-center px-5 pb-16 pt-8 sm:px-8 sm:pt-16"><ProductTour replay={replay} /></section>
  </main>;
}
