import "server-only";
import {
  formatCourtAccess,
  formatCourtOperatingHours,
  formatCourtReservation,
} from "@/features/venues/details";
import {
  type CourtListing,
  getCourtListings,
} from "@/features/venues/directory";
import type { AgentCourtSearch } from "./validation";

function courtSummary(court: CourtListing) {
  return {
    name: court.name,
    slug: court.slug,
    href: `/courts/${court.slug}`,
    address: court.address,
    environment: court.environment,
    courtCount: court.courtCount,
    access: formatCourtAccess(court.accessType),
    reservations: formatCourtReservation(court.reservationPolicy),
    status: court.operationalStatus,
    hours: formatCourtOperatingHours(court.operatingHours),
    price: court.priceLabel,
    parking: court.parkingLabel,
    paddleRental: court.paddleRental,
    amenities: court.amenities.slice(0, 20),
    verifiedAt: court.verifiedAt
      ? new Date(court.verifiedAt).toISOString()
      : null,
  };
}
export async function searchAgentCourts(input: AgentCourtSearch) {
  if (input.nearMe && !input.query.trim())
    return {
      requiresLocation: true,
      message:
        "Ask which city or neighborhood the user wants to play in. Device location is not available; never guess their location.",
    };
  const words = input.query
    .trim()
    .toLocaleLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  const matches = (await getCourtListings())
    .filter((court) => court.listingStatus === "verified")
    .filter((court) =>
      words.every((word) =>
        `${court.name} ${court.address}`.toLocaleLowerCase().includes(word)
      )
    )
    .sort((a, b) => a.name.localeCompare(b.name));
  return {
    courts: matches.slice(input.offset, input.offset + 8).map(courtSummary),
    hasMore: matches.length > input.offset + 8,
    nextOffset: matches.length > input.offset + 8 ? input.offset + 8 : null,
    matchedCount: matches.length,
    search: "Court name and address matches in Relay's directory",
    note: "Directory information is not live booking availability. Check the court page and contact the venue to confirm prices, hours, access and available slots.",
  };
}
export async function readAgentCourt(slug: string) {
  const court = (await getCourtListings()).find(
    (item) => item.slug === slug && item.listingStatus === "verified"
  );
  if (!court) return { unavailable: true };
  return {
    ...courtSummary(court),
    contact: court.contact,
    note: "Confirm details and availability with the venue. External booking links are on the court page.",
  };
}
