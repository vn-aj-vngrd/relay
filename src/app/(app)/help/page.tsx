import { requireUser } from "@/features/auth/session";
import { HelpCenterContent } from "@/features/help/help-center-content";
import { getPhilippinesVenues } from "@/features/venues/queries";

export default async function HelpPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const [, courts, params] = await Promise.all([requireUser(), getPhilippinesVenues(), searchParams]);

  return <HelpCenterContent courts={courts} query={params.q} />;
}
