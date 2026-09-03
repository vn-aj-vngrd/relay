"use server";

import { randomBytes } from "node:crypto";

import { and, eq, ilike, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import {
  adminAuditLogs,
  venueChangeRequests,
  venueOperatingPeriods,
  venues,
} from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

import {
  buildVenueProposedChanges,
  venueProposedChangesSchema,
} from "./change-requests";
import {
  buildCourtOperatingHours,
  courtDays,
  toCourtPriceStorage,
} from "./details";
import { expireCourtDirectory } from "./directory";
import { adminVenueSchema, venueSubmissionSchema } from "./domain";

export type VenueActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

function venueSlug(name: string) {
  const base = name
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  return `${base || "philippines-court"}-${randomBytes(3).toString("hex")}`;
}

function operatingHoursFormData(formData: FormData) {
  return Object.fromEntries(
    courtDays.flatMap(({ key }) => [
      [`${key}Open`, formData.get(`${key}Open`)],
      [`${key}Close`, formData.get(`${key}Close`)],
    ])
  );
}

export async function submitVenueAction(
  _: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const user = await requireUser();
  const limit = await checkRateLimit(
    { scope: "venue-submit", limit: 5, windowSeconds: 86400 },
    `user:${user.id}`
  );
  if (!limit.allowed)
    return {
      error: "You’ve submitted several courts recently. Try again tomorrow.",
    };
  const parsed = venueSubmissionSchema.safeParse({
    requestType: formData.get("requestType"),
    venueId: formData.get("venueId") ?? "",
    changedFields: formData.getAll("changedFields"),
    name: formData.get("name"),
    address: formData.get("address"),
    city: formData.get("city"),
    officialUrl: formData.get("officialUrl"),
    environment: formData.get("environment"),
    courtCount: formData.get("courtCount"),
    accessType: formData.get("accessType"),
    reservationPolicy: formData.get("reservationPolicy"),
    operationalStatus: formData.get("operationalStatus"),
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

  const targetVenue =
    parsed.data.requestType === "update"
      ? await db.query.venues.findFirst({
          columns: { id: true },
          where: and(
            eq(venues.id, parsed.data.venueId),
            eq(venues.listingStatus, "verified")
          ),
        })
      : null;
  if (parsed.data.requestType === "update" && !targetVenue)
    return {
      error:
        "This court is no longer available to update. Return to Court Finder and choose another court.",
    };

  if (parsed.data.requestType === "create") {
    const duplicate = await db.query.venues.findFirst({
      columns: { id: true },
      where: or(
        ilike(venues.name, parsed.data.name),
        and(
          ilike(venues.address, `%${parsed.data.address}%`),
          ilike(venues.address, `%${parsed.data.city}%`)
        )
      ),
    });
    if (duplicate)
      return {
        error:
          "This court may already be listed. Open its court page and choose Suggest an update instead.",
      };
  }

  await db.insert(venueChangeRequests).values({
    requestType: parsed.data.requestType,
    venueId: targetVenue?.id ?? null,
    proposedChanges: buildVenueProposedChanges(parsed.data),
    evidenceUrls: [parsed.data.officialUrl],
    note: parsed.data.note || null,
    submittedById: user.id,
  });
  revalidatePath("/admin/courts");
  return {
    success:
      parsed.data.requestType === "create"
        ? "Court submitted for review. It will appear after Relay verifies the location and source."
        : "Update submitted for review. The public court stays unchanged until Relay verifies the new information.",
  };
}

export async function updateVenueAction(
  _: VenueActionState,
  formData: FormData
): Promise<VenueActionState> {
  const actor = await requireAdmin();
  const parsed = adminVenueSchema.safeParse({
    venueId: formData.get("venueId"),
    name: formData.get("name"),
    address: formData.get("address"),
    latitude: formData.get("latitude"),
    longitude: formData.get("longitude"),
    environment: formData.get("environment"),
    courtCount: formData.get("courtCount"),
    accessType: formData.get("accessType"),
    reservationPolicy: formData.get("reservationPolicy"),
    operationalStatus: formData.get("operationalStatus"),
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
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Check the court details.",
    };

  const existing = await db.query.venues.findFirst({
    where: eq(venues.id, parsed.data.venueId),
  });
  if (!existing) return { error: "This court no longer exists." };
  const verified = parsed.data.listingStatus === "verified";

  await db.transaction(async (transaction) => {
    await transaction
      .update(venues)
      .set({
        name: parsed.data.name,
        address: parsed.data.address,
        latitude:
          parsed.data.latitude === "" ? null : String(parsed.data.latitude),
        longitude:
          parsed.data.longitude === "" ? null : String(parsed.data.longitude),
        environment: parsed.data.environment || null,
        courtCount:
          parsed.data.courtCount === "" ? null : parsed.data.courtCount,
        accessType: parsed.data.accessType,
        reservationPolicy: parsed.data.reservationPolicy,
        operationalStatus: parsed.data.operationalStatus,
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
    await transaction
      .delete(venueOperatingPeriods)
      .where(eq(venueOperatingPeriods.venueId, existing.id));
    const periods = buildCourtOperatingHours(parsed.data);
    if (periods.length)
      await transaction
        .insert(venueOperatingPeriods)
        .values(periods.map((period) => ({ venueId: existing.id, ...period })));
    if (verified)
      await transaction
        .update(venueChangeRequests)
        .set({
          status: "approved",
          reviewedById: actor.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(venueChangeRequests.venueId, existing.id),
            eq(venueChangeRequests.requestType, "create"),
            eq(venueChangeRequests.status, "in_review")
          )
        );
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

const reviewRequestSchema = z.object({
  requestId: z.uuid(),
  decision: z.enum(["rejected", "duplicate"]),
  resolutionNote: z.string().trim().min(3).max(600),
});

export async function applyVenueChangeRequestAction(formData: FormData) {
  const actor = await requireAdmin();
  const requestId = z.uuid().parse(formData.get("requestId"));
  const request = await db.query.venueChangeRequests.findFirst({
    where: eq(venueChangeRequests.id, requestId),
  });
  if (
    !request ||
    !["submitted", "needs_info", "in_review"].includes(request.status)
  )
    redirect("/admin/court-requests");
  const parsedProposal = venueProposedChangesSchema.safeParse(
    request.proposedChanges
  );
  if (!parsedProposal.success)
    throw new Error("This court request contains invalid proposed changes.");
  const proposal = parsedProposal.data;

  if (request.requestType === "create" && request.venueId)
    redirect(`/admin/courts/${request.venueId}`);

  let targetId = request.venueId;
  if (request.requestType === "create") {
    const { name, address } = proposal;
    if (!name || !address)
      throw new Error("A new court request needs a name and address.");
    targetId = await db.transaction(async (transaction) => {
      const [created] = await transaction
        .insert(venues)
        .values({
          slug: venueSlug(name),
          name,
          address,
          environment: proposal.environment,
          courtCount: proposal.courtCount,
          accessType: proposal.accessType,
          reservationPolicy: proposal.reservationPolicy,
          operationalStatus: proposal.operationalStatus,
          priceStatus: proposal.priceStatus,
          priceAmountCents: proposal.priceAmountCents,
          priceMaxCents: proposal.priceMaxCents,
          priceUnit: proposal.priceUnit,
          parkingStatus: proposal.parkingStatus,
          amenities: proposal.amenities,
          paddleRental: proposal.paddleRental,
          contact: proposal.contact,
          websiteUrl: proposal.websiteUrl,
          socialUrl: proposal.socialUrl,
          bookingUrl: proposal.bookingUrl,
          listingStatus: "pending",
          source: "community",
          sourceUrl: request.evidenceUrls[0] ?? null,
          submittedById: request.submittedById,
          verificationNote: request.note,
        })
        .returning({ id: venues.id });
      if (!created) throw new Error("The court draft could not be created.");
      if (proposal.operatingHours?.length)
        await transaction.insert(venueOperatingPeriods).values(
          proposal.operatingHours.map((period, sequence) => ({
            venueId: created.id,
            sequence,
            ...period,
          }))
        );
      await transaction
        .update(venueChangeRequests)
        .set({
          venueId: created.id,
          status: "in_review",
          reviewedById: actor.id,
          updatedAt: new Date(),
        })
        .where(eq(venueChangeRequests.id, request.id));
      await transaction.insert(adminAuditLogs).values({
        actorUserId: actor.id,
        action: "venue.change_request_staged",
        targetType: "venue_change_request",
        targetId: request.id,
        metadata: { venueId: created.id, requestType: request.requestType },
      });
      return created.id;
    });
  } else {
    const existing = targetId
      ? await db.query.venues.findFirst({ where: eq(venues.id, targetId) })
      : null;
    if (!existing)
      throw new Error("The court attached to this request no longer exists.");
    const has = (key: keyof typeof proposal) => Object.hasOwn(proposal, key);
    await db.transaction(async (transaction) => {
      await transaction
        .update(venues)
        .set({
          name: has("name") ? proposal.name : existing.name,
          address: has("address") ? proposal.address : existing.address,
          environment: has("environment")
            ? proposal.environment
            : existing.environment,
          courtCount: has("courtCount")
            ? proposal.courtCount
            : existing.courtCount,
          accessType: has("accessType")
            ? proposal.accessType
            : existing.accessType,
          reservationPolicy: has("reservationPolicy")
            ? proposal.reservationPolicy
            : existing.reservationPolicy,
          operationalStatus: has("operationalStatus")
            ? proposal.operationalStatus
            : existing.operationalStatus,
          priceStatus: has("priceStatus")
            ? proposal.priceStatus
            : existing.priceStatus,
          priceAmountCents: has("priceAmountCents")
            ? proposal.priceAmountCents
            : existing.priceAmountCents,
          priceMaxCents: has("priceMaxCents")
            ? proposal.priceMaxCents
            : existing.priceMaxCents,
          priceUnit: has("priceUnit") ? proposal.priceUnit : existing.priceUnit,
          parkingStatus: has("parkingStatus")
            ? proposal.parkingStatus
            : existing.parkingStatus,
          amenities: has("amenities") ? proposal.amenities : existing.amenities,
          paddleRental: has("paddleRental")
            ? proposal.paddleRental
            : existing.paddleRental,
          contact: has("contact") ? proposal.contact : existing.contact,
          websiteUrl: has("websiteUrl")
            ? proposal.websiteUrl
            : existing.websiteUrl,
          socialUrl: has("socialUrl") ? proposal.socialUrl : existing.socialUrl,
          bookingUrl: has("bookingUrl")
            ? proposal.bookingUrl
            : existing.bookingUrl,
          verifiedAt: new Date(),
          verifiedById: actor.id,
          lastSeenAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(venues.id, existing.id));
      if (has("operatingHours")) {
        await transaction
          .delete(venueOperatingPeriods)
          .where(eq(venueOperatingPeriods.venueId, existing.id));
        if (proposal.operatingHours?.length)
          await transaction.insert(venueOperatingPeriods).values(
            proposal.operatingHours.map((period, sequence) => ({
              venueId: existing.id,
              sequence,
              ...period,
            }))
          );
      }
      await transaction
        .update(venueChangeRequests)
        .set({
          status: "approved",
          reviewedById: actor.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(venueChangeRequests.id, request.id));
      await transaction.insert(adminAuditLogs).values({
        actorUserId: actor.id,
        action: "venue.change_request_approved",
        targetType: "venue_change_request",
        targetId: request.id,
        metadata: { venueId: existing.id, requestType: request.requestType },
      });
    });
    expireCourtDirectory();
  }

  revalidatePath("/admin/courts");
  revalidatePath("/admin/court-requests");
  revalidatePath("/court");
  revalidatePath("/courts");
  redirect(`/admin/courts/${targetId}`);
}

export async function resolveVenueChangeRequestAction(formData: FormData) {
  const actor = await requireAdmin();
  const parsed = reviewRequestSchema.parse({
    requestId: formData.get("requestId"),
    decision: formData.get("decision"),
    resolutionNote: formData.get("resolutionNote"),
  });
  const request = await db.query.venueChangeRequests.findFirst({
    where: eq(venueChangeRequests.id, parsed.requestId),
  });
  if (
    !request ||
    ["approved", "rejected", "duplicate", "withdrawn"].includes(request.status)
  )
    redirect("/admin/court-requests");
  await db.transaction(async (transaction) => {
    await transaction
      .update(venueChangeRequests)
      .set({
        status: parsed.decision,
        resolutionNote: parsed.resolutionNote,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(venueChangeRequests.id, request.id));
    await transaction.insert(adminAuditLogs).values({
      actorUserId: actor.id,
      action: `venue.change_request_${parsed.decision}`,
      targetType: "venue_change_request",
      targetId: request.id,
      reason: parsed.resolutionNote,
      metadata: { venueId: request.venueId, requestType: request.requestType },
    });
  });
  revalidatePath("/admin/court-requests");
  redirect("/admin/court-requests");
}
