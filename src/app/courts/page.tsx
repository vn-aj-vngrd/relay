import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";
import { CourtFinder } from "@/features/venues/court-finder";
import { getCourtListings } from "@/features/venues/directory";

export const metadata: Metadata = {
  title: "Pickleball courts in the Philippines",
  description:
    "Find reviewed pickleball courts across the Philippines. Check the location, setting, price, and booking link.",
};

export default async function CourtPage() {
  const [courts, user] = await Promise.all([getCourtListings(), getCurrentUser()]);
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <h1 className="sr-only">Find a pickleball court in the Philippines</h1>
      <CourtFinder
        venues={courts}
        isAuthenticated={Boolean(user)}
        detailBasePath="/courts"
        showFilterTopBorder={false}
        className="flex min-h-0 flex-1 flex-col"
      />
    </div>
  );
}
