import "server-only";
import { and, eq } from "drizzle-orm";
import { db } from "@/db/client";
import { venues } from "@/db/schema";
import type { CreationDatabase } from "./create-session-command";

export function manilaDate(
  date: FormDataEntryValue | null,
  time: FormDataEntryValue | null
) {
  if (typeof date !== "string" || typeof time !== "string")
    return new Date(Number.NaN);
  return new Date(`${date}T${time}:00+08:00`);
}

export function costInput(formData: FormData) {
  const costKind = formData.get("costKind");
  return {
    costKind: costKind === "free" ? "free" : "unspecified",
    playerPriceCents: costKind === "free" ? 0 : undefined,
  };
}

export function bookingInput(formData: FormData) {
  const rawTotal = formData.get("bookingTotal");
  const bookingNotRequired = formData.get("bookingNotRequired") === "on";
  const booked = !bookingNotRequired && formData.get("booked") === "on";
  return {
    booked,
    bookingNotRequired,
    bookingReference: booked
      ? formData.get("bookingReference") || undefined
      : undefined,
    bookingTotalCents:
      booked && typeof rawTotal === "string" && rawTotal
        ? Math.round(Number(rawTotal) * 100)
        : undefined,
    bookingNotes: booked
      ? formData.get("bookingNotes") || undefined
      : undefined,
  };
}

export async function verifiedVenue(
  venueId?: string,
  database: CreationDatabase = db
) {
  if (!venueId) return null;
  return database.query.venues.findFirst({
    where: and(eq(venues.id, venueId), eq(venues.listingStatus, "verified")),
  });
}
