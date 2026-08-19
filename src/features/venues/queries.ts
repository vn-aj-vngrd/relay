import "server-only";

import { and, asc, inArray, isNotNull } from "drizzle-orm";

import { db } from "@/db/client";
import { venues } from "@/db/schema";

export type CebuVenue = {
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

export async function getCebuVenues(): Promise<CebuVenue[]> {
  const rows = await db
    .select()
    .from(venues)
    .where(
      and(
        inArray(venues.listingStatus, ["unverified", "verified"]),
        isNotNull(venues.latitude),
        isNotNull(venues.longitude),
      ),
    )
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
