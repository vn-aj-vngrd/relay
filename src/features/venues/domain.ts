import { z } from "zod";

import { courtDirectoryCoverage } from "./coverage";
import { courtDays, courtParkingStatuses, courtPriceStatuses, courtPriceUnits } from "./details";

type OperatingHourField = `${(typeof courtDays)[number]["key"]}${"Open" | "Close"}`;

const optionalCourtTime = z.union([z.literal(""), z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/)]);
const optionalPrice = z.union([z.literal(""), z.coerce.number().min(0).max(1_000_000)]);

const optionalHttpUrl = z.union([
  z
    .url("Add a complete link beginning with https://.")
    .refine((value) => /^https?:\/\//i.test(value), "Use an http or https link."),
  z.literal(""),
]);

const sharedVenueFields = {
  environment: z.enum(["indoor", "outdoor", "semi-indoor", "covered", "mixed", ""]),
  courtCount: z.union([z.coerce.number().int().min(1).max(50), z.literal("")]),
  priceStatus: z.enum(courtPriceStatuses),
  priceAmount: optionalPrice,
  priceMax: optionalPrice,
  priceUnit: z.enum([...courtPriceUnits, ""]),
  mondayOpen: optionalCourtTime,
  mondayClose: optionalCourtTime,
  tuesdayOpen: optionalCourtTime,
  tuesdayClose: optionalCourtTime,
  wednesdayOpen: optionalCourtTime,
  wednesdayClose: optionalCourtTime,
  thursdayOpen: optionalCourtTime,
  thursdayClose: optionalCourtTime,
  fridayOpen: optionalCourtTime,
  fridayClose: optionalCourtTime,
  saturdayOpen: optionalCourtTime,
  saturdayClose: optionalCourtTime,
  sundayOpen: optionalCourtTime,
  sundayClose: optionalCourtTime,
  parkingStatus: z.enum([...courtParkingStatuses, ""]),
  amenities: z
    .array(z.enum(["Restrooms", "Showers", "Seating", "Water station", "Changing rooms", "Lockers", "Pro shop"]))
    .max(7),
  paddleRental: z.boolean(),
  contact: z.string().trim().max(160),
  websiteUrl: optionalHttpUrl,
  socialUrl: optionalHttpUrl,
  bookingUrl: optionalHttpUrl,
};

function validateStructuredDetails(
  value: {
    priceStatus: (typeof courtPriceStatuses)[number];
    priceAmount: number | "";
    priceMax: number | "";
    priceUnit: (typeof courtPriceUnits)[number] | "";
  } & Record<OperatingHourField, string>,

  context: z.RefinementCtx,
) {
  if (value.priceStatus === "paid" && (value.priceAmount === "" || value.priceUnit === ""))
    context.addIssue({
      code: "custom",
      path: [value.priceAmount === "" ? "priceAmount" : "priceUnit"],
      message: "Paid courts need a starting price and pricing mode.",
    });
  if (value.priceStatus === "paid" && value.priceAmount !== "" && value.priceAmount <= 0)
    context.addIssue({ code: "custom", path: ["priceAmount"], message: "Starting price must be above ₱0." });
  if (value.priceMax !== "" && (value.priceAmount === "" || value.priceMax < value.priceAmount))
    context.addIssue({
      code: "custom",
      path: ["priceMax"],
      message: "Maximum price must be at least the starting price.",
    });
  if (value.priceStatus !== "paid" && (value.priceAmount !== "" || value.priceMax !== "" || value.priceUnit !== ""))
    context.addIssue({
      code: "custom",
      path: ["priceStatus"],
      message: "Only paid courts can include an amount or pricing mode.",
    });
  for (const { key } of courtDays) {
    const openField = `${key}Open` as OperatingHourField;
    const closeField = `${key}Close` as OperatingHourField;
    if ((value[openField] === "") !== (value[closeField] === ""))
      context.addIssue({
        code: "custom",
        path: [value[openField] === "" ? openField : closeField],
        message: "Add both opening and closing time, or leave both blank.",
      });
  }
}

export const venueSubmissionSchema = z
  .object({
    name: z.string().trim().min(2, "Add the court name.").max(120, "Keep the name under 120 characters."),
    address: z.string().trim().min(5, "Add a useful street or neighborhood address.").max(240),
    city: z.string().trim().min(2, "Add the Philippine city or municipality.").max(80),
    officialUrl: z
      .url("Add a complete source or Google Maps link beginning with https://.")
      .refine((value) => /^https?:\/\//i.test(value), "Use an http or https link."),
    ...sharedVenueFields,
    note: z.string().trim().max(600, "Keep the note under 600 characters."),
  })
  .superRefine(validateStructuredDetails);

export const adminVenueSchema = z
  .object({
    venueId: z.uuid(),
    name: z.string().trim().min(2).max(120),
    address: z.string().trim().min(5).max(240),
    latitude: z.union([z.coerce.number(), z.literal("")]),
    longitude: z.union([z.coerce.number(), z.literal("")]),
    ...sharedVenueFields,
    sourceUrl: optionalHttpUrl,
    listingStatus: z.enum(["unverified", "pending", "verified", "rejected", "archived"]),
    verificationNote: z.string().trim().max(600),
  })
  .superRefine((value, context) => {
    validateStructuredDetails(value, context);
    if (!["unverified", "verified"].includes(value.listingStatus)) return;
    for (const issue of courtDirectoryCoverage.validatePublishingCoordinate(value))
      context.addIssue({ code: "custom", path: [issue.path], message: issue.message });
  });
