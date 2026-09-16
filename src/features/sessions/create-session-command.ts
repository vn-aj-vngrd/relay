import "server-only";
import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db as defaultDb } from "@/db/client";
import {
  billingGameUsage,
  courts,
  expenses,
  groupMembers,
  notifications,
  paymentAccounts,
  profiles,
  sessionPlayers,
  sessions,
} from "@/db/schema";
import { trackSessionMilestone } from "@/features/analytics/events";
import type { requireUser } from "@/features/auth/session";
import { BillingError } from "@/features/billing/domain";
import { checkGameCreation } from "@/features/billing/usage";
import {
  collectionSetupValues,
  hasSavedPaymentSetup,
  paymentChoiceSchema,
  paymentSetupInput,
  paymentSetupSchema,
  serializableCreationValues,
} from "@/features/payments/setup";
import { ensureProfile } from "@/features/players/profile";
import { checkRateLimit } from "@/lib/rate-limit";
import type { SessionActionState } from "./actions";
import { createSessionDestination } from "./create-session-destination";
import {
  bookingInput,
  costInput,
  manilaDate,
  verifiedVenue,
} from "./create-session-input";
import { createSessionSchema, sessionInviteeIds } from "./domain";
import { sessionSlug } from "./slug";

export type CreationHooks = {
  beforeCreate: (
    tx: Parameters<Parameters<typeof defaultDb.transaction>[0]>[0]
  ) => Promise<void>;
  afterCreate: (
    tx: Parameters<Parameters<typeof defaultDb.transaction>[0]>[0],
    destination: string
  ) => Promise<void>;
};
export type CreationDatabase =
  | typeof defaultDb
  | Parameters<Parameters<typeof defaultDb.transaction>[0]>[0];

export async function createSessionCommand(
  user: Awaited<ReturnType<typeof requireUser>>,
  formData: FormData,
  hooks?: CreationHooks
): Promise<SessionActionState & { destination?: string }> {
  const db = defaultDb;
  const limit = await checkRateLimit(
    { scope: "session-create-attempt", limit: 20, windowSeconds: 60 },
    `user:${user.id}`
  );
  if (!limit.allowed)
    return {
      error:
        "Game creation is happening too quickly. Wait a minute and try again.",
    };
  const requestKey = z.uuid().safeParse(formData.get("creationKey"));
  if (!requestKey.success)
    return { error: "Reload this form before creating the game." };
  const choice = paymentChoiceSchema.safeParse(
    formData.get("costKind") ?? "unspecified"
  );
  if (!choice.success)
    return {
      error: "Choose Decide later, Free, or Collect payment.",
      fieldErrors: { costKind: ["Choose a payment option."] },
    };
  const collect = choice.data === "collect";
  const paymentSetup =
    collect && hasSavedPaymentSetup(serializableCreationValues(formData))
      ? paymentSetupSchema.safeParse(paymentSetupInput(formData))
      : null;
  if (paymentSetup && !paymentSetup.success)
    return {
      error: "Complete the expense, total, method, and payment details.",
      fieldErrors: {
        costKind: ["Complete payment setup or choose Decide later."],
      },
    };
  const hostProfile = await ensureProfile(user);
  const parsed = createSessionSchema().safeParse({
    title: formData.get("title"),
    accentColor: formData.get("accentColor") || "violet",
    venueId: formData.get("venueId") || undefined,
    venueName: formData.get("venue"),
    venueAddress: formData.get("venueAddress") || undefined,
    startsAt: manilaDate(formData.get("date"), formData.get("start")),
    endsAt: manilaDate(formData.get("date"), formData.get("end")),
    capacity: formData.get("capacity"),
    courtCount: formData.get("courts"),
    notes: formData.get("notes") || undefined,
    visibility: formData.get("visibility") || "link",
    ...costInput(formData),
    ...bookingInput(formData),
  });
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      error: "A few details need attention. Check the fields marked below.",
      values: Object.fromEntries(
        [
          "title",
          "accentColor",
          "venue",
          "venueId",
          "venueAddress",
          "date",
          "capacity",
          "start",
          "end",
          "courts",
          "visibility",
          "label",
          "total",
          "items",
          "contributionMode",
          "fixedRate",
          "method",
          "details",
          "costKind",
          "cost",
          "notes",
          "booked",
          "bookingReference",
          "bookingTotal",
          "bookingNotes",
          "requiresApproval",
          "hostPlaying",
        ].map((key) => [key, String(formData.get(key) ?? "")])
      ),
      fieldErrors: {
        title: errors.title ?? [],
        venue: [...(errors.venueId ?? []), ...(errors.venueName ?? [])],
        date: errors.startsAt ?? [],
        start: errors.startsAt ?? [],
        end: errors.endsAt ?? [],
        capacity: errors.capacity ?? [],
        courts: errors.courtCount ?? [],
        notes: errors.notes ?? [],
        costKind: errors.costKind ?? [],
        cost: errors.playerPriceCents ?? [],
        booked: errors.booked ?? [],
        bookingReference: errors.bookingReference ?? [],
        bookingTotal: errors.bookingTotalCents ?? [],
        bookingNotes: errors.bookingNotes ?? [],
      },
    };
  }
  const selectedVenue = await verifiedVenue(parsed.data.venueId, db);
  if (parsed.data.venueId && !selectedVenue)
    return {
      error:
        "The selected Relay court is no longer available. Choose another court or enter it manually.",
      fieldErrors: {
        venue: ["Choose another verified court or edit the court name."],
      },
      values: Object.fromEntries(
        Array.from(formData.entries(), ([key, value]) => [key, String(value)])
      ),
    };

  const intent = formData.get("intent") === "draft" ? "draft" : "published";
  const requestedGroupId = String(formData.get("groupId") ?? "");
  const sourceSessionId = String(formData.get("sourceSessionId") ?? "");
  const groupMembership = requestedGroupId
    ? await db.query.groupMembers.findFirst({
        where: and(
          eq(groupMembers.groupId, requestedGroupId),
          eq(groupMembers.userId, user.id)
        ),
      })
    : null;
  if (requestedGroupId && !groupMembership)
    return { error: "This group is no longer available to you." };
  const source = sourceSessionId
    ? await db.query.sessions.findFirst({
        where: and(
          eq(sessions.id, sourceSessionId),
          eq(sessions.hostId, user.id),
          eq(sessions.status, "completed")
        ),
      })
    : null;
  if (sourceSessionId && !source)
    return { error: "Only the original host can replay this game." };
  const invitedUserIds =
    intent === "published"
      ? requestedGroupId
        ? (
            await db
              .select({ userId: groupMembers.userId })
              .from(groupMembers)
              .where(eq(groupMembers.groupId, requestedGroupId))
          ).map(({ userId }) => userId)
        : source
          ? (
              await db
                .select({ userId: sessionPlayers.userId })
                .from(sessionPlayers)
                .where(
                  and(
                    eq(sessionPlayers.sessionId, source.id),
                    eq(sessionPlayers.rsvp, "going")
                  )
                )
            )
              .map(({ userId }) => userId)
              .filter((id): id is string => Boolean(id))
          : []
      : [];
  const inviteeExperience = invitedUserIds.length
    ? await db
        .select({ userId: profiles.userId, skillLevel: profiles.skillLevel })
        .from(profiles)
        .where(inArray(profiles.userId, invitedUserIds))
    : [];
  const experienceByUser = new Map(
    inviteeExperience.map((profile) => [profile.userId, profile.skillLevel])
  );
  const hostPlaying = formData.get("hostPlaying") !== "no";
  let created: typeof sessions.$inferSelect;
  try {
    created = await db.transaction(async (tx) => {
      await hooks?.beforeCreate(tx);
      if (requestedGroupId) {
        const membership = await tx.query.groupMembers.findFirst({
          where: and(
            eq(groupMembers.groupId, requestedGroupId),
            eq(groupMembers.userId, user.id)
          ),
        });
        if (!membership)
          throw new BillingError("This group is no longer available to you.");
      }
      if (sourceSessionId) {
        const [currentSource] = await tx
          .select()
          .from(sessions)
          .where(
            and(eq(sessions.id, sourceSessionId), eq(sessions.hostId, user.id))
          )
          .for("update");
        if (currentSource?.status !== "completed")
          throw new BillingError(
            "This source game is no longer available for replay."
          );
      }
      if (intent === "published" && (requestedGroupId || sourceSessionId)) {
        const currentInvitees = requestedGroupId
          ? (
              await tx
                .select({ id: groupMembers.userId })
                .from(groupMembers)
                .where(eq(groupMembers.groupId, requestedGroupId))
            ).map(({ id }) => id)
          : (
              await tx
                .select({ id: sessionPlayers.userId })
                .from(sessionPlayers)
                .where(
                  and(
                    eq(sessionPlayers.sessionId, sourceSessionId),
                    eq(sessionPlayers.rsvp, "going")
                  )
                )
            ).flatMap(({ id }) => (id ? [id] : []));
        if (
          JSON.stringify([...new Set(currentInvitees)].sort()) !==
          JSON.stringify([...new Set(invitedUserIds)].sort())
        )
          throw new BillingError(
            "The invitation list changed. Review the game again."
          );
      }
      const creation = await checkGameCreation(tx, user.id, requestKey.data);
      if (creation.existingSessionId) {
        const previous = await tx.query.sessions.findFirst({
          where: eq(sessions.id, creation.existingSessionId),
        });
        if (!previous)
          throw new BillingError(
            "This creation already completed, but the game was deleted. Start a new game form."
          );
        await hooks?.afterCreate(
          tx,
          createSessionDestination(previous.id, previous.status === "published")
        );
        return previous;
      }
      const [session] = await tx
        .insert(sessions)
        .values({
          slug: sessionSlug(parsed.data.title),
          hostId: user.id,
          groupId: groupMembership?.groupId ?? null,
          title: parsed.data.title,
          accentColor: parsed.data.accentColor,
          venueId: selectedVenue?.id ?? null,
          venueName: selectedVenue?.name ?? parsed.data.venueName,
          venueAddress:
            selectedVenue?.address ?? parsed.data.venueAddress ?? null,
          startsAt: parsed.data.startsAt,
          endsAt: parsed.data.endsAt,
          capacity: parsed.data.capacity,
          courtCount: parsed.data.courtCount,
          notes: parsed.data.notes,
          paymentCollectionRequested: collect,
          playerPriceCents:
            paymentSetup?.success &&
            paymentSetup.data.contributionMode === "fixed"
              ? Math.round(paymentSetup.data.fixedRate! * 100)
              : parsed.data.playerPriceCents,
          visibility: parsed.data.visibility,
          status: intent,
          publishedAt: intent === "published" ? new Date() : null,
          bookedAt: parsed.data.booked ? new Date() : null,
          bookingNotRequired: parsed.data.bookingNotRequired,
          bookingReference: parsed.data.booked
            ? (parsed.data.bookingReference ?? null)
            : null,
          bookingTotalCents: parsed.data.booked
            ? (parsed.data.bookingTotalCents ?? null)
            : null,
          bookingNotes: parsed.data.booked
            ? (parsed.data.bookingNotes ?? null)
            : null,
          requiresApproval: formData.get("requiresApproval") === "on",
        })
        .returning();
      if (paymentSetup?.success) {
        const setup = paymentSetup.data;
        const [account] = await tx
          .insert(paymentAccounts)
          .values({
            ownerId: user.id,
            method: setup.method,
            label: setup.method,
            details: setup.details,
          })
          .returning();
        await tx.insert(expenses).values({
          sessionId: session.id,
          kind: "court",
          label: setup.label,
          ...collectionSetupValues(setup),
          paidById: user.id,
          paymentAccountId: account.id,
        });
      }
      await tx.insert(sessionPlayers).values({
        sessionId: session.id,
        userId: user.id,
        skillLevel: hostProfile.skillLevel,
        role: "host",
        rsvp: hostPlaying ? "going" : "declined",
        playState: hostPlaying ? "waiting" : "unavailable",
        respondedAt: new Date(),
      });
      const invitees = sessionInviteeIds(user.id, invitedUserIds);
      if (invitees.length) {
        await tx.insert(sessionPlayers).values(
          invitees.map((userId) => ({
            sessionId: session.id,
            userId,
            skillLevel: experienceByUser.get(userId) ?? null,
            role: "player" as const,
            rsvp: "invited" as const,
            invitationReceivedAt: new Date(),
            playState: "unavailable" as const,
          }))
        );
        await tx.insert(notifications).values(
          invitees.map((userId) => ({
            userId,
            sessionId: session.id,
            type: "session_invite",
            payload: {
              groupId: groupMembership?.groupId ?? null,
              hostName: hostProfile.name,
              startsAt: session.startsAt.toISOString(),
              venueName: session.venueName,
            },
          }))
        );
      }
      await tx.insert(courts).values(
        Array.from({ length: session.courtCount }, (__, index) => ({
          sessionId: session.id,
          label: `Court ${index + 1}`,
          position: index + 1,
        }))
      );
      await tx.insert(billingGameUsage).values({
        userId: user.id,
        requestKey: requestKey.data,
        sessionId: session.id,
        createdAt: creation.createdAt,
      });
      await hooks?.afterCreate(
        tx,
        createSessionDestination(session.id, intent === "published")
      );
      return session;
    });
  } catch (error) {
    if (error instanceof BillingError) return { error: error.message };
    throw error;
  }
  if (intent === "published") {
    const event = {
      userId: user.id,
      sessionId: created.id,
      source: "authenticated" as const,
      metadata: {
        courtCount: created.courtCount,
        capacity: created.capacity,
        fromGroup: Boolean(created.groupId),
      },
    };
    await Promise.all([
      trackSessionMilestone({ ...event, name: "session_published" }),
      ...(source
        ? [trackSessionMilestone({ ...event, name: "play_again_published" })]
        : []),
    ]);
  }
  revalidatePath("/home");
  revalidatePath("/games");
  revalidatePath("/groups");
  return {
    destination: createSessionDestination(created.id, intent === "published"),
  };
}
