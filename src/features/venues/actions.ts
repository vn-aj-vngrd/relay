"use server";

import { createHash, randomBytes } from "node:crypto";

import { and, eq, ilike, inArray, or } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import {
  adminAuditLogs,
  notifications,
  venueChangeRequests,
  venueOperatingPeriods,
  venues,
} from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit, requestIdentity } from "@/lib/rate-limit";

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
import { openVenueChangeRequestStatuses } from "./request-status";

export type VenueActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

function requestFingerprint(parts: string[]) {
  return createHash("sha256")
    .update(
      parts
        .map((part) => part.trim().toLowerCase().replace(/\s+/g, " "))
        .join("|")
    )
    .digest("base64url");
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

function courtSuggestionNotification(input: {
  userId: string;
  requestId: string;
  outcome: "approved" | "rejected" | "duplicate";
  courtName: string;
  note?: string | null;
}) {
  const title =
    input.outcome === "approved"
      ? "Court suggestion applied"
      : input.outcome === "duplicate"
        ? "Court suggestion already covered"
        : "Court suggestion reviewed";
  const body =
    input.note ||
    (input.outcome === "approved"
      ? `${input.courtName} was updated after Relay reviewed your suggestion.`
      : input.outcome === "duplicate"
        ? `${input.courtName} is already listed or covered by another suggestion.`
        : `Relay reviewed your suggestion for ${input.courtName} but did not apply it.`);
  return {
    userId: input.userId,
    type: `court_suggestion_${input.outcome}`,
    payload: { title, body },
    dedupeKey: `court-suggestion:${input.requestId}:${input.outcome}`,
  };
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
  const ipIdentity = await requestIdentity();
  const [userAttemptLimit, ipAttemptLimit] = await Promise.all([
    checkRateLimit(
      { scope: "venue-submit-attempt", limit: 20, windowSeconds: 3600 },
      `user:${user.id}`
    ),
    checkRateLimit(
      { scope: "venue-submit-attempt", limit: 60, windowSeconds: 3600 },
      ipIdentity
    ),
  ]);
  if (!userAttemptLimit.allowed || !ipAttemptLimit.allowed)
    return {
      error:
        "Too many submission attempts. Check the form and try again later.",
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

  const proposedChanges = buildVenueProposedChanges(parsed.data);
  const fingerprint =
    parsed.data.requestType === "update"
      ? requestFingerprint(["update", user.id, parsed.data.venueId])
      : requestFingerprint([
          "create",
          parsed.data.name,
          parsed.data.address,
          parsed.data.city,
        ]);
  const [unresolvedCount, courtOpenCount, duplicateRequest] = await Promise.all(
    [
      db.$count(
        venueChangeRequests,
        and(
          eq(venueChangeRequests.submittedById, user.id),
          inArray(venueChangeRequests.status, openVenueChangeRequestStatuses)
        )
      ),
      targetVenue
        ? db.$count(
            venueChangeRequests,
            and(
              eq(venueChangeRequests.venueId, targetVenue.id),
              inArray(
                venueChangeRequests.status,
                openVenueChangeRequestStatuses
              )
            )
          )
        : Promise.resolve(0),
      db.query.venueChangeRequests.findFirst({
        columns: { id: true },
        where: and(
          eq(venueChangeRequests.fingerprint, fingerprint),
          inArray(venueChangeRequests.status, openVenueChangeRequestStatuses)
        ),
      }),
    ]
  );
  if (duplicateRequest)
    return {
      error:
        parsed.data.requestType === "update"
          ? "You already have an update for this court awaiting review."
          : "This missing court has already been submitted for review.",
    };
  if (unresolvedCount >= 10)
    return {
      error:
        "You already have 10 suggestions awaiting review. Wait for a decision before sending another.",
    };
  if (courtOpenCount >= 5)
    return {
      error:
        "This court already has several updates awaiting review. Try again after Relay processes them.",
    };

  const acceptedLimit = await checkRateLimit(
    { scope: "venue-submit-accepted", limit: 3, windowSeconds: 86400 },
    `user:${user.id}`
  );
  if (!acceptedLimit.allowed)
    return {
      error: "You’ve submitted three suggestions today. Try again tomorrow.",
    };

  const inserted = await db
    .insert(venueChangeRequests)
    .values({
      requestType: parsed.data.requestType,
      venueId: targetVenue?.id ?? null,
      fingerprint,
      proposedChanges,
      evidenceUrls: [parsed.data.officialUrl],
      note: parsed.data.note || null,
      submittedById: user.id,
    })
    .onConflictDoNothing()
    .returning({ id: venueChangeRequests.id });
  if (!inserted.length)
    return {
      error:
        parsed.data.requestType === "update"
          ? "You already have an update for this court awaiting review."
          : "This missing court has already been submitted for review.",
    };

  revalidatePath("/court/suggest");
  revalidatePath("/admin/courts");
  revalidatePath("/admin/court-requests");
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
    if (verified) {
      const approvedRequests = await transaction
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
        )
        .returning({
          id: venueChangeRequests.id,
          submittedById: venueChangeRequests.submittedById,
        });
      const notificationRows = approvedRequests.flatMap((request) =>
        request.submittedById
          ? [
              courtSuggestionNotification({
                userId: request.submittedById,
                requestId: request.id,
                outcome: "approved",
                courtName: parsed.data.name,
              }),
            ]
          : []
      );
      if (notificationRows.length)
        await transaction
          .insert(notifications)
          .values(notificationRows)
          .onConflictDoNothing({ target: notifications.dedupeKey });
    }
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
  revalidatePath("/court/suggest");
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
      const [approvedRequest] = await transaction
        .update(venueChangeRequests)
        .set({
          status: "approved",
          reviewedById: actor.id,
          reviewedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(venueChangeRequests.id, request.id),
            inArray(venueChangeRequests.status, openVenueChangeRequestStatuses)
          )
        )
        .returning({ id: venueChangeRequests.id });
      if (!approvedRequest)
        throw new Error("This court request was already reviewed.");
      if (request.submittedById)
        await transaction
          .insert(notifications)
          .values(
            courtSuggestionNotification({
              userId: request.submittedById,
              requestId: request.id,
              outcome: "approved",
              courtName: existing.name,
            })
          )
          .onConflictDoNothing({ target: notifications.dedupeKey });
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
  revalidatePath("/court/suggest");
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
    const [resolvedRequest] = await transaction
      .update(venueChangeRequests)
      .set({
        status: parsed.decision,
        resolutionNote: parsed.resolutionNote,
        reviewedById: actor.id,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(venueChangeRequests.id, request.id),
          inArray(venueChangeRequests.status, openVenueChangeRequestStatuses)
        )
      )
      .returning({ id: venueChangeRequests.id });
    if (!resolvedRequest)
      throw new Error("This court request was already reviewed.");
    if (request.requestType === "create" && request.venueId)
      await transaction
        .update(venues)
        .set({
          listingStatus: "rejected",
          verificationNote: parsed.resolutionNote,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(venues.id, request.venueId),
            eq(venues.listingStatus, "pending")
          )
        );
    if (request.submittedById) {
      const proposal = request.proposedChanges as Record<string, unknown>;
      await transaction
        .insert(notifications)
        .values(
          courtSuggestionNotification({
            userId: request.submittedById,
            requestId: request.id,
            outcome: parsed.decision,
            courtName:
              typeof proposal.name === "string"
                ? proposal.name
                : "your court listing",
            note: parsed.resolutionNote,
          })
        )
        .onConflictDoNothing({ target: notifications.dedupeKey });
    }
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
  revalidatePath("/court/suggest");
  redirect("/admin/court-requests");
}
