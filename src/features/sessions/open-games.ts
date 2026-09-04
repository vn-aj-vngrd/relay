import { z } from "zod";

export const openGameDateFilters = [
  "any",
  "today",
  "7d",
  "30d",
  "custom",
] as const;
export type OpenGameDateFilter = (typeof openGameDateFilters)[number];
export const openGameTimeFilters = [
  "any",
  "morning",
  "afternoon",
  "evening",
  "custom",
] as const;
export const openGamePriceFilters = ["any", "free", "paid"] as const;

const optionalDate = z.union([z.iso.date(), z.literal("")]).default("");
const optionalTime = z
  .union([z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/), z.literal("")])
  .default("");
const optionalPrice = z
  .union([
    z.literal(""),
    z
      .string()
      .trim()
      .regex(/^\d{1,6}(?:\.\d{1,2})?$/)
      .transform((pesos) => Number(pesos) * 100)
      .pipe(z.number().int().min(1).max(10_000_000)),
  ])
  .default("")
  .transform((value) => (value === "" ? null : value));

export const openGamesFilterSchema = z
  .object({
    date: z.enum(openGameDateFilters).default("any"),
    dateFrom: optionalDate,
    dateTo: optionalDate,
    time: z.enum(openGameTimeFilters).default("any"),
    timeFrom: optionalTime,
    timeTo: optionalTime,
    location: z
      .string()
      .trim()
      .max(80, "Keep the location search under 80 characters.")
      .default(""),
    available: z
      .union([z.literal("1"), z.literal("0"), z.literal("")])
      .default("")
      .transform((value) => value === "1"),
    price: z.enum(openGamePriceFilters).default("any"),
    minPrice: optionalPrice,
    maxPrice: optionalPrice,
  })
  .refine(
    (filters) =>
      !(filters.dateFrom && filters.dateTo) ||
      filters.dateFrom <= filters.dateTo,
    { message: "The end date must be on or after the start date." }
  )
  .refine(
    (filters) =>
      !(filters.timeFrom && filters.timeTo) ||
      filters.timeFrom < filters.timeTo,
    { message: "The end time must be after the start time." }
  )
  .refine(
    (filters) =>
      filters.price !== "paid" ||
      filters.minPrice === null ||
      filters.maxPrice === null ||
      filters.minPrice <= filters.maxPrice,
    { message: "The maximum price must be at least the minimum price." }
  );

const cursorSchema = z.object({
  at: z.iso.datetime({ offset: true }),
  id: z.uuid(),
});
export type OpenGameCursor = { at: Date; id: string };

export function encodeOpenGameCursor(cursor: OpenGameCursor) {
  return Buffer.from(
    JSON.stringify({ at: cursor.at.toISOString(), id: cursor.id }),
    "utf8"
  ).toString("base64url");
}

export function parseOpenGameCursor(
  value: string | null | undefined
): OpenGameCursor | null {
  if (!value) return null;
  try {
    const parsed = cursorSchema.safeParse(
      JSON.parse(Buffer.from(value, "base64url").toString("utf8"))
    );
    return parsed.success
      ? { at: new Date(parsed.data.at), id: parsed.data.id }
      : null;
  } catch {
    return null;
  }
}

export type OpenGameItem = {
  id: string;
  slug: string;
  title: string;
  startsAt: string;
  endsAt: string;
  date: string;
  time: string;
  venue: string;
  venueAddress: string | null;
  hostName: string;
  playerCount: number;
  capacity: number;
  estimatedCostCents: number;
  requiresApproval: boolean;
  status: "published" | "live";
  accentColor: string;
  viewerRsvp:
    | "invited"
    | "pending"
    | "going"
    | "maybe"
    | "waitlisted"
    | "declined"
    | null;
};

export type OpenGamesPage = {
  items: OpenGameItem[];
  nextCursor: string | null;
};
export type OpenGamesFilters = z.output<typeof openGamesFilterSchema>;
