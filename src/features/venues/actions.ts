"use server";

import { randomBytes } from "node:crypto";

import { and, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { adminAuditLogs, venueOperatingPeriods, venues } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

import { buildCourtOperatingHours, courtDays, toCourtPriceStorage } from "./details";
import { expireCourtDirectory } from "./directory";
import { adminVenueSchema, venueSubmissionSchema } from "./domain";

export type VenueActionState = { error?: string; success?: string; fieldErrors?: Record<string, string[]> };

function operatingHoursFormData(formData: FormData) {
  return Object.fromEntries(
    courtDays.flatMap(({ key }) => [
      [`${key}Open`, formData.get(`${key}Open`)],
      [`${key}Close`, formData.get(`${key}Close`)],
    ]),
  );
}

function venueSlug(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `${base || "philippines-court"}-${randomBytes(3).toString("hex")}`;
}

export async function submitVenueAction(_: VenueActionState, formData: FormData): Promise<VenueActionState> {
  const user = await requireUser();
  const limit = await checkRateLimit({ scope: "venue-submit", limit: 5, windowSeconds: 86400 }, `user:${user.id}`);
  if (!limit.allowed) return { error: "You’ve submitted several courts recently. Try again tomorrow." };
  const parsed = venueSubmissionSchema.safeParse({
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    officialUrl: formData.get("officialUrl"),
    environment: formData.get("environment"),
    courtCount: formData.get("courtCount"),
    priceStatus: formData.get("priceStatus"),
    priceAmount: formData.get("priceAmount"),
    priceMax: formData.get("priceMax"),
    priceUnit: formData.get("priceUnit"),
    ...operatingHoursFormData(formData),
    parkingStatus: formData.get("parkingStatus"),
    amenities: formData.getAll("amenities"),
    paddleRental: formData.get("paddleRental") === "on",
    contact: formData.get("contact"),
    websiteUrl: formData.get("websiteUrl"),
    socialUrl: formData.get("socialUrl"),
    bookingUrl: formData.get("bookingUrl"),
    note: formData.get("note"),
  });
  if (!parsed.success)
    return {
      error: "Check the court details below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };

  const address = `${parsed.data.address}, ${parsed.data.city}`;
  const duplicate = await db.query.venues.findFirst({
    columns: { id: true },
    where: or(
      ilike(venues.name, parsed.data.name),
      and(ilike(venues.address, `%${parsed.data.address}%`), ilike(venues.address, `%${parsed.data.city}%`)),
    ),
  });
  if (duplicate) return { error: "This court may already be listed. Search the map before submitting another copy." };

  await db.transaction(async (transaction) => {
    const [created] = await transaction
      .insert(venues)
      .values({
        slug: venueSlug(parsed.data.name),
        name: parsed.data.name,
        address,
        listingStatus: "pending",
        environment: parsed.data.environment || null,
        courtCount: parsed.data.courtCount === "" ? null : parsed.data.courtCount,
        ...toCourtPriceStorage(parsed.data),
        parkingStatus: parsed.data.parkingStatus || null,
        amenities: parsed.data.amenities,
        paddleRental: parsed.data.paddleRental,
        contact: parsed.data.contact || null,
        websiteUrl: parsed.data.websiteUrl || null,
        socialUrl: parsed.data.socialUrl || null,
        bookingUrl: parsed.data.bookingUrl || null,
        source: "community",
        sourceUrl: parsed.data.officialUrl,
        submittedById: user.id,
        verificationNote: parsed.data.note || null,
      })
      .returning({ id: venues.id });
    const periods = buildCourtOperatingHours(parsed.data);
    if (created && periods.length)
      await transaction
        .insert(venueOperatingPeriods)
        .values(periods.map((period) => ({ venueId: created.id, ...period })));
  });
  revalidatePath("/admin/courts");
  return { success: "Court submitted for review. It will appear after an admin verifies the location." };
}

export async function updateVenueAction(_: VenueActionState, formData: FormData): Promise<VenueActionState> {
  const actor = await requireAdmin();
  const parsed = adminVenueSchema.safeParse({
    venueId: formData.get("venueId"),
    name: formData.get("name"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    environment: formData.get("environment"),
    courtCount: formData.get("courtCount"),
    priceStatus: formData.get("priceStatus"),
    priceAmount: formData.get("priceAmount"),
    priceMax: formData.get("priceMax"),
    priceUnit: formData.get("priceUnit"),
    ...operatingHoursFormData(formData),
    parkingStatus: formData.get("parkingStatus"),
    amenities: formData.getAll("amenities"),
    paddleRental: formData.get("paddleRental") === "on",
    contact: formData.get("contact"),
    sourceUrl: formData.get("sourceUrl"),
    websiteUrl: formData.get("websiteUrl"),
    socialUrl: formData.get("socialUrl"),
    bookingUrl: formData.get("bookingUrl"),
    listingStatus: formData.get("listingStatus"),
    verificationNote: formData.get("verificationNote"),
  });
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Check the court details." };

  const existing = await db.query.venues.findFirst({ where: eq(venues.id, parsed.data.venueId) });
  if (!existing) return { error: "This court no longer exists." };
  const verified = parsed.data.listingStatus === "verified";

  await db.transaction(async (transaction) => {
    await transaction
      .update(venues)
      .set({
        name: parsed.data.name,
        address: parsed.data.address,
        latitude: parsed.data.latitude === "" ? null : String(parsed.data.latitude),
        longitude: parsed.data.longitude === "" ? null : String(parsed.data.longitude),
        environment: parsed.data.environment || null,
        courtCount: parsed.data.courtCount === "" ? null : parsed.data.courtCount,
        ...toCourtPriceStorage(parsed.data),
        parkingStatus: parsed.data.parkingStatus || null,
        amenities: parsed.data.amenities,
        paddleRental: parsed.data.paddleRental,
        contact: parsed.data.contact || null,
        sourceUrl: parsed.data.sourceUrl || null,
        websiteUrl: parsed.data.websiteUrl || null,
        socialUrl: parsed.data.socialUrl || null,
        bookingUrl: parsed.data.bookingUrl || null,
        listingStatus: parsed.data.listingStatus,
        verificationNote: parsed.data.verificationNote || null,
        verifiedAt: verified ? (existing.verifiedAt ?? new Date()) : null,
        verifiedById: verified ? actor.id : null,
        updatedAt: new Date(),
      })
      .where(eq(venues.id, existing.id));
    await transaction.delete(venueOperatingPeriods).where(eq(venueOperatingPeriods.venueId, existing.id));
    const periods = buildCourtOperatingHours(parsed.data);
    if (periods.length)
      await transaction
        .insert(venueOperatingPeriods)
        .values(periods.map((period) => ({ venueId: existing.id, ...period })));
    await transaction.insert(adminAuditLogs).values({
      actorUserId: actor.id,
      action: "venue.updated",
      targetType: "venue",
      targetId: existing.id,
      metadata: { status: parsed.data.listingStatus, source: existing.source },
    });
  });
  expireCourtDirectory();
  revalidatePath("/court");
  revalidatePath("/courts");
  revalidatePath(`/court/${existing.slug}`);
  revalidatePath(`/courts/${existing.slug}`);
  revalidatePath("/admin/courts");
  revalidatePath(`/admin/courts/${existing.id}`);
  return { success: "Court saved." };
}
