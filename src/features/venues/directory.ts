import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";
import { unstable_cache, updateTag } from "next/cache";

import { db } from "@/db/client";
import { venues } from "@/db/schema";

import { courtDirectoryCoverage } from "./coverage";

const courtDirectoryTag = "court-directory";
const courtDirectorySnapshot = "2026-09-01";

export type CourtListing = {
  id: string;
  slug: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  environment: string | null;
  courtCount: number | null;
  hours: Record<string, string> | null;
  priceRange: string | null;
  parking: string | null;
  amenities: string[];
  paddleRental: boolean;
  contact: string | null;
  websiteUrl: string | null;
  socialUrl: string | null;
  bookingUrl: string | null;
  listingStatus: "unverified" | "verified";
  sourceUrl: string | null;
};

async function queryCourtListings(): Promise<CourtListing[]> {
  const rows = await db
    .select()
    .from(venues)
    .where(and(eq(venues.listingStatus, "verified"), isNotNull(venues.latitude), isNotNull(venues.longitude)))
    .orderBy(asc(venues.name));

  return rows.flatMap((venue) => {
    const latitude = Number(venue.latitude);
    const longitude = Number(venue.longitude);
    if (!courtDirectoryCoverage.contains({ latitude, longitude })) return [];
    return [
      {
        id: venue.id,
        slug: venue.slug,
        name: venue.name,
        address: venue.address,
        latitude,
        longitude,
        environment: venue.environment,
        courtCount: venue.courtCount,
        hours: venue.hours,
        priceRange: venue.priceRange,
        parking: venue.parking,
        amenities: venue.amenities ?? [],
        paddleRental: venue.paddleRental,
        contact: venue.contact,
        websiteUrl: venue.websiteUrl,
        socialUrl: venue.socialUrl,
        bookingUrl: venue.bookingUrl,
        listingStatus: venue.listingStatus as "unverified" | "verified",
        sourceUrl: venue.sourceUrl,
      },
    ];
  });
}

export const getCourtListings = unstable_cache(queryCourtListings, [courtDirectoryTag, courtDirectorySnapshot], {
  revalidate: 3600,
  tags: [courtDirectoryTag],
});

export async function getCourtListingBySlug(slug: string) {
  return (await getCourtListings()).find((court) => court.slug === slug) ?? null;
}

export async function getCourtSuggestions() {
  return (await getCourtListings()).map(({ id, name, address }) => ({ id, name, address }));
}

/** Expires every Court Directory read after a verified listing changes. Server Actions only. */
export function expireCourtDirectory() {
  updateTag(courtDirectoryTag);
}
