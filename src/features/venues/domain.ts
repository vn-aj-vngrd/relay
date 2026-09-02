import { z } from "zod";

import { courtDirectoryCoverage } from "./coverage";

const optionalHttpUrl = z.union([
  z
    .url("Add a complete link beginning with https://.")
    .refine((value) => /^https?:\/\//i.test(value), "Use an http or https link."),
  z.literal(""),
]);

export const venueSubmissionSchema = z.object({
  name: z.string().trim().min(2, "Add the court name.").max(120, "Keep the name under 120 characters."),
  address: z.string().trim().min(5, "Add a useful street or neighborhood address.").max(240),
  city: z.string().trim().min(2, "Add the Philippine city or municipality.").max(80),
  officialUrl: z
    .url("Add a complete source or Google Maps link beginning with https://.")
    .refine((value) => /^https?:\/\//i.test(value), "Use an http or https link."),
  environment: z.enum(["indoor", "outdoor", "semi-indoor", "covered", "mixed", ""]),
  courtCount: z.union([z.coerce.number().int().min(1).max(50), z.literal("")]),
  priceRange: z.string().trim().max(160, "Keep price guidance under 160 characters."),
  hours: z.string().trim().max(240, "Keep operating hours under 240 characters."),
  parking: z.string().trim().max(160, "Keep parking details under 160 characters."),
  amenities: z.array(z.enum(["Restrooms", "Showers", "Seating", "Water station", "Changing rooms", "Lockers", "Pro shop"])).max(7),
  paddleRental: z.boolean(),
  contact: z.string().trim().max(160, "Keep the public contact under 160 characters."),
  websiteUrl: optionalHttpUrl,
  socialUrl: optionalHttpUrl,
  bookingUrl: optionalHttpUrl,
  note: z.string().trim().max(600, "Keep the note under 600 characters."),
});

export const adminVenueSchema = z
  .object({
    venueId: z.uuid(),
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().min(5).max(240),
    latitude: z.union([z.coerce.number(), z.literal("")]),
    longitude: z.union([z.coerce.number(), z.literal("")]),
    environment: z.enum(["indoor", "outdoor", "semi-indoor", "covered", "mixed", ""]),
    courtCount: z.union([z.coerce.number().int().min(1).max(50), z.literal("")]),
    priceRange: z.string().trim().max(160),
    hours: z.string().trim().max(240),
    parking: z.string().trim().max(160),
    amenities: z.array(z.enum(["Restrooms", "Showers", "Seating", "Water station", "Changing rooms", "Lockers", "Pro shop"])).max(7),
    paddleRental: z.boolean(),
    contact: z.string().trim().max(160),
    sourceUrl: optionalHttpUrl,
    websiteUrl: optionalHttpUrl,
    socialUrl: optionalHttpUrl,
    bookingUrl: optionalHttpUrl,
    listingStatus: z.enum(["unverified", "pending", "verified", "rejected", "archived"]),
    verificationNote: z.string().trim().max(600),
  })
  .superRefine((value, context) => {
    if (!["unverified", "verified"].includes(value.listingStatus)) return;
    for (const issue of courtDirectoryCoverage.validatePublishingCoordinate(value))
      context.addIssue({ code: "custom", path: [issue.path], message: issue.message });
  });
