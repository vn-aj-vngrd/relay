import { z } from "zod";

import { buildCourtOperatingHours, toCourtPriceStorage } from "./details";
import type { venueSubmissionSchema } from "./domain";

export type VenueSubmission = z.infer<typeof venueSubmissionSchema>;

const proposedFields = {
  identity: ["name", "address"],
  status: ["operationalStatus"],
  access: ["accessType", "reservationPolicy"],
  hours: ["operatingHours"],
  pricing: ["priceStatus", "priceAmountCents", "priceMaxCents", "priceUnit"],
  facilities: ["environment", "courtCount", "amenities", "paddleRental"],
  parking: ["parkingStatus"],
  booking: ["contact", "websiteUrl", "socialUrl", "bookingUrl"],
} as const;

export const venueProposedChangesSchema = z
  .object({
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().min(5).max(320),
    operationalStatus: z.enum([
      "unknown",
      "operating",
      "temporarily_closed",
      "seasonal",
      "opening_soon",
      "permanently_closed",
    ]),
    accessType: z.enum([
      "unknown",
      "public",
      "commercial",
      "members",
      "residents",
      "school_or_community",
      "invitation",
    ]),
    reservationPolicy: z.enum([
      "unknown",
      "walk_in",
      "reservation_required",
      "walk_in_or_reserve",
      "contact",
    ]),
    operatingHours: z.array(
      z.object({
        dayOfWeek: z.number().int().min(1).max(7),
        opensAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
        closesAt: z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
      })
    ),
    priceStatus: z.enum([
      "unknown",
      "free",
      "paid",
      "contact",
      "donation",
      "members",
      "invitation",
    ]),
    priceAmountCents: z.number().int().nonnegative().nullable(),
    priceMaxCents: z.number().int().nonnegative().nullable(),
    priceUnit: z
      .enum([
        "hour",
        "player",
        "court",
        "session",
        "court_hour",
        "player_session",
      ])
      .nullable(),
    environment: z
      .enum(["indoor", "outdoor", "semi-indoor", "covered", "mixed"])
      .nullable(),
    courtCount: z.number().int().min(1).max(50).nullable(),
    amenities: z
      .array(
        z.enum([
          "Restrooms",
          "Showers",
          "Seating",
          "Water station",
          "Changing rooms",
          "Lockers",
          "Pro shop",
        ])
      )
      .max(7),
    paddleRental: z.boolean(),
    parkingStatus: z.enum(["available", "unavailable"]).nullable(),
    contact: z.string().max(160).nullable(),
    websiteUrl: z.string().url().nullable(),
    socialUrl: z.string().url().nullable(),
    bookingUrl: z.string().url().nullable(),
  })
  .partial();

export type VenueProposedChanges = {
  name?: string;
  address?: string;
  operationalStatus?: VenueSubmission["operationalStatus"];
  accessType?: VenueSubmission["accessType"];
  reservationPolicy?: VenueSubmission["reservationPolicy"];
  operatingHours?: ReturnType<typeof buildCourtOperatingHours>;
  priceStatus?: VenueSubmission["priceStatus"];
  priceAmountCents?: number | null;
  priceMaxCents?: number | null;
  priceUnit?: VenueSubmission["priceUnit"] | null;
  environment?: VenueSubmission["environment"] | null;
  courtCount?: number | null;
  amenities?: VenueSubmission["amenities"];
  paddleRental?: boolean;
  parkingStatus?: VenueSubmission["parkingStatus"] | null;
  contact?: string | null;
  websiteUrl?: string | null;
  socialUrl?: string | null;
  bookingUrl?: string | null;
};

export function buildVenueProposedChanges(
  input: VenueSubmission
): VenueProposedChanges {
  const address =
    input.requestType === "create"
      ? `${input.address}, ${input.city}`
      : input.address;
  const allChanges: VenueProposedChanges = {
    name: input.name,
    address,
    operationalStatus: input.operationalStatus,
    accessType: input.accessType,
    reservationPolicy: input.reservationPolicy,
    operatingHours: buildCourtOperatingHours(input),
    ...toCourtPriceStorage(input),
    environment: input.environment || null,
    courtCount: input.courtCount === "" ? null : input.courtCount,
    amenities: input.amenities,
    paddleRental: input.paddleRental,
    parkingStatus: input.parkingStatus || null,
    contact: input.contact || null,
    websiteUrl: input.websiteUrl || null,
    socialUrl: input.socialUrl || null,
    bookingUrl: input.bookingUrl || null,
  };
  if (input.requestType === "create") return allChanges;

  const selectedKeys = new Set(
    input.changedFields.flatMap((group) => proposedFields[group])
  );
  return Object.fromEntries(
    Object.entries(allChanges).filter(([key]) => selectedKeys.has(key as never))
  ) as VenueProposedChanges;
}
