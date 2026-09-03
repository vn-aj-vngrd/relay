import { requireUser } from "@/features/auth/session";
import { HelpCenterContent } from "@/features/help/help-center-content";
import { getCourtListings } from "@/features/venues/directory";

export default async function HelpPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const [, courts, params] = await Promise.all([
    requireUser(),
    getCourtListings(),
    searchParams,
  ]);

  return <HelpCenterContent courts={courts} query={params.q} />;
}
