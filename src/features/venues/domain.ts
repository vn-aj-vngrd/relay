import { z } from "zod";

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
  officialUrl: optionalHttpUrl,
  note: z.string().trim().max(600, "Keep the note under 600 characters."),
});

export const adminVenueSchema = z
  .object({
    venueId: z.uuid(),
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().min(5).max(240),
    latitude: z.union([z.coerce.number().min(4.45).max(21.35), z.literal("")]),
    longitude: z.union([z.coerce.number().min(116.8).max(126.7), z.literal("")]),
    environment: z.enum(["indoor", "outdoor", "semi-indoor", "covered", ""]),
    courtCount: z.union([z.coerce.number().int().min(1).max(50), z.literal("")]),
    priceRange: z.string().trim().max(160),
    hours: z.string().trim().max(240),
    parking: z.string().trim().max(160),
    contact: z.string().trim().max(160),
    websiteUrl: optionalHttpUrl,
    socialUrl: optionalHttpUrl,
    bookingUrl: optionalHttpUrl,
    listingStatus: z.enum(["unverified", "pending", "verified", "rejected", "archived"]),
    verificationNote: z.string().trim().max(600),
  })
  .superRefine((value, context) => {
    if (!["unverified", "verified"].includes(value.listingStatus)) return;
    if (value.latitude === "")
      context.addIssue({
        code: "custom",
        path: ["latitude"],
        message: "Add a Philippines latitude before publishing.",
      });
    if (value.longitude === "")
      context.addIssue({
        code: "custom",
        path: ["longitude"],
        message: "Add a Philippines longitude before publishing.",
      });
  });
