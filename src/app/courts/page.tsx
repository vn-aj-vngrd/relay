import type { Metadata } from "next";

import { getCurrentUser } from "@/features/auth/session";
import { CourtFinder } from "@/features/venues/court-finder";
import { getCourtListings } from "@/features/venues/directory";

export const metadata: Metadata = {
  title: "Pickleball courts in the Philippines",
  description:
    "Find verified pickleball courts across the Philippines. Search by city or province and compare setting, court count, structured pricing, parking, operating hours, directions, and booking links.",
  alternates: { canonical: "/courts" },
  openGraph: {
    title: "Pickleball courts in the Philippines",
    description:
      "Search verified Philippine pickleball courts with locations, prices, amenities, and booking links.",
    url: "/courts",
    type: "website",
    images: [
      {
        url: "/opengraph-image",
        width: 1200,
        height: 630,
        alt: "Relay Philippines court finder",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Pickleball courts in the Philippines",
    description:
      "Search verified courts by city, province, setting, price, parking, and operating hours.",
    images: ["/opengraph-image"],
  },
};

export default async function CourtPage() {
  const [courts, user] = await Promise.all([
    getCourtListings(),
    getCurrentUser(),
  ]);
  return (
    <div className="court-finder-workspace flex min-h-0 flex-1 flex-col xl:h-full">
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
