import "server-only";

import { and, asc, eq, isNotNull } from "drizzle-orm";
import { unstable_cache, updateTag } from "next/cache";

import { db } from "@/db/client";
import { venueOperatingPeriods, venues } from "@/db/schema";

import { courtDirectoryCoverage } from "./coverage";
import {
  type CourtDay,
  type CourtOperatingPeriod,
  type CourtParkingStatus,
  type CourtPriceStatus,
  type CourtPriceUnit,
  formatCourtParking,
  formatCourtPrice,
} from "./details";

const courtDirectoryTag = "court-directory";
const courtDirectorySnapshot = "2026-09-02-structured-hours-and-parking";

export type CourtListing = {
  id: string;
  slug: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  environment: string | null;
  courtCount: number | null;
  operatingHours: CourtOperatingPeriod[];
  priceStatus: CourtPriceStatus;
  priceAmountCents: number | null;
  priceLabel: string | null;
  parkingStatus: CourtParkingStatus | null;
  parkingLabel: string | null;
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
  const directoryCondition = and(
    eq(venues.listingStatus, "verified"),
    isNotNull(venues.latitude),
    isNotNull(venues.longitude),
  );
  const [rows, operatingPeriods] = await Promise.all([
    db.select().from(venues).where(directoryCondition).orderBy(asc(venues.name)),
    db
      .select({
        venueId: venueOperatingPeriods.venueId,
        dayOfWeek: venueOperatingPeriods.dayOfWeek,
        opensAt: venueOperatingPeriods.opensAt,
        closesAt: venueOperatingPeriods.closesAt,
      })
      .from(venueOperatingPeriods)
      .innerJoin(venues, eq(venues.id, venueOperatingPeriods.venueId))
      .where(directoryCondition)
      .orderBy(
        asc(venueOperatingPeriods.venueId),
        asc(venueOperatingPeriods.dayOfWeek),
        asc(venueOperatingPeriods.sequence),
      ),
  ]);
  const periodsByVenue = new Map<string, CourtOperatingPeriod[]>();
  for (const period of operatingPeriods) {
    const venuePeriods = periodsByVenue.get(period.venueId) ?? [];
    venuePeriods.push({
      dayOfWeek: period.dayOfWeek as CourtDay,
      opensAt: period.opensAt.slice(0, 5),
      closesAt: period.closesAt.slice(0, 5),
    });
    periodsByVenue.set(period.venueId, venuePeriods);
  }

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
        operatingHours: periodsByVenue.get(venue.id) ?? [],
        priceStatus: venue.priceStatus as CourtPriceStatus,
        priceAmountCents: venue.priceAmountCents,
        priceLabel: formatCourtPrice({
          priceStatus: venue.priceStatus as CourtPriceStatus,
          priceAmountCents: venue.priceAmountCents,
          priceMaxCents: venue.priceMaxCents,
          priceUnit: venue.priceUnit as CourtPriceUnit | null,
        }),
        parkingStatus: venue.parkingStatus,
        parkingLabel: formatCourtParking(venue.parkingStatus),
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
