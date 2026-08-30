import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";
import { unstable_cache } from "next/cache";

import { db } from "@/db/client";
import { venues } from "@/db/schema";

export type PhilippinesVenue = {
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

export async function getVenueSuggestions() {
  return db
    .select({ id: venues.id, name: venues.name, address: venues.address })
    .from(venues)
    .where(eq(venues.listingStatus, "verified"))
    .orderBy(asc(venues.name));
}

async function queryPhilippinesVenues(): Promise<PhilippinesVenue[]> {
  const rows = await db
    .select()
    .from(venues)
    .where(and(eq(venues.listingStatus, "verified"), isNotNull(venues.latitude), isNotNull(venues.longitude)))
    .orderBy(asc(venues.name));

  return rows.flatMap((venue) => {
    const latitude = Number(venue.latitude);
    const longitude = Number(venue.longitude);
    if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) return [];
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

export const getPhilippinesVenues = unstable_cache(queryPhilippinesVenues, ["philippines-venues"], {
  revalidate: 3600,
  tags: ["philippines-venues"],
});
