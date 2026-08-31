"use server";

import { and, eq, gt, inArray, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import {
  courts,
  groupMembers,
  matches,
  messages,
  notifications,
  profiles,
  sessionPlayers,
  sessionQueue,
  sessions,
} from "@/db/schema";
import { trackProductEvent } from "@/features/analytics/events";
import { can, sessionActor } from "@/features/auth/permissions";
import { getCurrentUser, requireUser } from "@/features/auth/session";
import { reconcileUnpaidExpenseShares } from "@/features/payments/sync";
import { playingExperienceValues } from "@/features/players/playing-experience";
import { ensureProfile } from "@/features/players/profile";
import { assertRateLimit, checkRateLimit, requestIdentity } from "@/lib/rate-limit";

import { createSessionSchema, findRosterIdentity, sessionInviteeIds, updateSessionSchema } from "./domain";
import { planRosterTransition } from "./roster";
import { sessionSlug } from "./slug";

export type SessionActionState = {
  error?: string;
  success?: boolean;
  playerOutcome?: "added" | "invited";
  rsvp?: "going" | "maybe" | "pending" | "waitlisted" | "declined";
  fieldErrors?: Record<string, string[]>;
  values?: Record<string, string>;
};

function manilaDate(date: FormDataEntryValue | null, time: FormDataEntryValue | null) {
  if (typeof date !== "string" || typeof time !== "string") return new Date(Number.NaN);
  return new Date(`${date}T${time}:00+08:00`);
}

export async function createSessionAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const user = await requireUser();
  const limit = await checkRateLimit({ scope: "session-create", limit: 5, windowSeconds: 86400 }, `user:${user.id}`);
  if (!limit.allowed) return { error: "You’ve created several games today. Try again tomorrow." };
  const hostProfile = await ensureProfile(user);
  const rawCost = formData.get("cost");
  const parsed = createSessionSchema().safeParse({
    title: formData.get("title"),
    accentColor: formData.get("accentColor") || "violet",
    venueName: formData.get("venue"),
    venueAddress: formData.get("venueAddress") || undefined,
    startsAt: manilaDate(formData.get("date"), formData.get("start")),
    endsAt: manilaDate(formData.get("date"), formData.get("end")),
    capacity: formData.get("capacity"),
    courtCount: formData.get("courts"),
    notes: formData.get("notes") || undefined,
    estimatedCostCents: typeof rawCost === "string" && rawCost ? Math.round(Number(rawCost) * 100) : undefined,
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
          "venueAddress",
          "date",
          "capacity",
          "start",
          "end",
          "courts",
          "cost",
          "courtNumbers",
          "notes",
          "booked",
          "requiresApproval",
        ].map((key) => [key, String(formData.get(key) ?? "")]),
      ),
      fieldErrors: {
        title: errors.title ?? [],
        venue: errors.venueName ?? [],
        date: errors.startsAt ?? [],
        start: errors.startsAt ?? [],
        end: errors.endsAt ?? [],
        capacity: errors.capacity ?? [],
        courts: errors.courtCount ?? [],
        notes: errors.notes ?? [],
        cost: errors.estimatedCostCents ?? [],
      },
    };
  }

  const intent = formData.get("intent") === "draft" ? "draft" : "published";
  const requestedGroupId = String(formData.get("groupId") ?? "");
  const sourceSessionId = String(formData.get("sourceSessionId") ?? "");
  const groupMembership = requestedGroupId
    ? await db.query.groupMembers.findFirst({
        where: and(eq(groupMembers.groupId, requestedGroupId), eq(groupMembers.userId, user.id)),
      })
    : null;
  if (requestedGroupId && !groupMembership) return { error: "This group is no longer available to you." };
  const source = sourceSessionId
    ? await db.query.sessions.findFirst({ where: and(eq(sessions.id, sourceSessionId), eq(sessions.hostId, user.id)) })
    : null;
  if (sourceSessionId && !source) return { error: "Only the original host can replay this game." };
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
                .where(and(eq(sessionPlayers.sessionId, source.id), eq(sessionPlayers.rsvp, "going")))
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
  const experienceByUser = new Map(inviteeExperience.map((profile) => [profile.userId, profile.skillLevel]));
  const courtNumbers = String(formData.get("courtNumbers") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  const created = await db.transaction(async (tx) => {
    const [session] = await tx
      .insert(sessions)
      .values({
        slug: sessionSlug(parsed.data.title),
        hostId: user.id,
        groupId: groupMembership?.groupId ?? null,
        title: parsed.data.title,
        accentColor: parsed.data.accentColor,
        venueName: parsed.data.venueName,
        venueAddress: parsed.data.venueAddress || null,
        startsAt: parsed.data.startsAt,
        endsAt: parsed.data.endsAt,
        capacity: parsed.data.capacity,
        courtCount: parsed.data.courtCount,
        courtNumbers,
        notes: parsed.data.notes,
        estimatedCostCents: parsed.data.estimatedCostCents,
        status: intent,
        publishedAt: intent === "published" ? new Date() : null,
        bookedAt: formData.get("booked") === "on" ? new Date() : null,
        requiresApproval: formData.get("requiresApproval") === "on",
      })
      .returning();
    await tx.insert(sessionPlayers).values({
      sessionId: session.id,
      userId: user.id,
      skillLevel: hostProfile.skillLevel,
      role: "host",
      rsvp: "going",
      playState: "waiting",
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
          playState: "unavailable" as const,
        })),
      );
      await tx.insert(notifications).values(
        invitees.map((userId) => ({
          userId,
          sessionId: session.id,
          type: "session_invite",
          payload: { groupId: groupMembership?.groupId ?? null },
        })),
      );
    }
    await tx.insert(courts).values(
      Array.from({ length: session.courtCount }, (__, index) => ({
        sessionId: session.id,
        label: courtNumbers[index] ? `Court ${courtNumbers[index]}` : `Court ${index + 1}`,
        position: index + 1,
      })),
    );
    return session;
  });
  if (intent === "published")
    await trackProductEvent({
      name: source ? "play_again_published" : "session_published",
      userId: user.id,
      sessionId: created.id,
      source: "authenticated",
      metadata: { courtCount: created.courtCount, capacity: created.capacity, fromGroup: Boolean(created.groupId) },
    });
  revalidatePath("/home");
  revalidatePath("/games");
  revalidatePath("/groups");
  redirect(`/games/${created.id}`);
}

function courtLabel(value: string | undefined, position: number) {
  if (!value) return `Court ${position}`;
  return /^court\b/i.test(value) ? value : `Court ${value}`;
}

export async function updateSessionAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const user = await requireUser();
  await assertRateLimit(
    { scope: "session-update", limit: 30, windowSeconds: 60 },
    `user:${user.id}`,
    "Game changes are happening too quickly. Wait a moment and try again.",
  );
  const rawCost = formData.get("cost");
  const rawBookingTotal = formData.get("bookingTotal");
  const parsed = updateSessionSchema.safeParse({
    sessionId: formData.get("sessionId"),
    version: formData.get("version"),
    title: formData.get("title"),
    accentColor: formData.get("accentColor") || "violet",
    venueName: formData.get("venue"),
    venueAddress: formData.get("venueAddress") || undefined,
    startsAt: manilaDate(formData.get("date"), formData.get("start")),
    endsAt: manilaDate(formData.get("date"), formData.get("end")),
    capacity: formData.get("capacity"),
    courtCount: formData.get("courts"),
    notes: formData.get("notes") || undefined,
    estimatedCostCents: typeof rawCost === "string" && rawCost ? Math.round(Number(rawCost) * 100) : undefined,
    visibility: formData.get("visibility"),
    requiresApproval: formData.get("requiresApproval") === "on",
    bookingReference: formData.get("bookingReference") || undefined,
    bookingTotalCents:
      typeof rawBookingTotal === "string" && rawBookingTotal ? Math.round(Number(rawBookingTotal) * 100) : undefined,
    bookingNotes: formData.get("bookingNotes") || undefined,
  });
  const savedValues = Object.fromEntries(
    [
      "title",
      "accentColor",
      "venue",
      "venueAddress",
      "date",
      "capacity",
      "start",
      "end",
      "courts",
      "cost",
      "courtNumbers",
      "notes",
      "visibility",
      "booked",
      "bookingReference",
      "bookingTotal",
      "bookingNotes",
      "requiresApproval",
    ].map((key) => [key, String(formData.get(key) ?? "")]),
  );
  if (!parsed.success) {
    const errors = parsed.error.flatten().fieldErrors;
    return {
      error: "A few details need attention. Check the fields marked below.",
      values: savedValues,
      fieldErrors: {
        title: errors.title ?? [],
        venue: errors.venueName ?? [],
        date: errors.startsAt ?? [],
        start: errors.startsAt ?? [],
        end: errors.endsAt ?? [],
        capacity: errors.capacity ?? [],
        courts: errors.courtCount ?? [],
        notes: errors.notes ?? [],
        cost: errors.estimatedCostCents ?? [],
        bookingReference: errors.bookingReference ?? [],
        bookingTotal: errors.bookingTotalCents ?? [],
        bookingNotes: errors.bookingNotes ?? [],
      },
    };
  }

  const existing = await db.query.sessions.findFirst({ where: eq(sessions.id, parsed.data.sessionId) });
  if (!existing) return { error: "This game no longer exists." };
  const membership = await db.query.sessionPlayers.findFirst({
    where: and(eq(sessionPlayers.sessionId, existing.id), eq(sessionPlayers.userId, user.id)),
  });
  const actor = sessionActor({ userId: user.id, hostId: existing.hostId, membership });
  if (!can(actor, "edit")) return { error: "Only the host or co-host can change game settings." };
  if (existing.status !== "draft" && existing.status !== "published")
    return { error: "Game details are locked after Play starts." };

  const goingCount = await db.$count(
    sessionPlayers,
    and(eq(sessionPlayers.sessionId, existing.id), eq(sessionPlayers.rsvp, "going")),
  );
  if (parsed.data.capacity < goingCount)
    return {
      error: `Player limit can’t be lower than the ${goingCount} players already going.`,
      values: savedValues,
      fieldErrors: { capacity: ["Increase the player limit or remove players first."] },
    };

  const labels = String(formData.get("courtNumbers") ?? "")
    .split(",")
    .map((value) => value.trim())
    .filter(Boolean);
  if (parsed.data.courtCount < existing.courtCount) {
    const removedCourts = await db
      .select({ id: courts.id })
      .from(courts)
      .where(and(eq(courts.sessionId, existing.id), gt(courts.position, parsed.data.courtCount)));
    if (removedCourts.length) {
      const matchCount = await db.$count(
        matches,
        inArray(
          matches.courtId,
          removedCourts.map((court) => court.id),
        ),
      );
      if (matchCount)
        return {
          error:
            "Court quantity can’t be reduced because matches are already assigned to a court that would be removed.",
          values: savedValues,
          fieldErrors: { courts: ["Keep the current court quantity or cancel those matches first."] },
        };
    }
  }

  const changedFields = [
    existing.title !== parsed.data.title ? "title" : null,
    existing.accentColor !== parsed.data.accentColor ? "game accent" : null,
    existing.venueName !== parsed.data.venueName || (existing.venueAddress ?? "") !== (parsed.data.venueAddress ?? "")
      ? "venue"
      : null,
    existing.startsAt.getTime() !== parsed.data.startsAt.getTime() ||
    existing.endsAt.getTime() !== parsed.data.endsAt.getTime()
      ? "schedule"
      : null,
    existing.capacity !== parsed.data.capacity ? "player limit" : null,
    existing.courtCount !== parsed.data.courtCount ||
    JSON.stringify(existing.courtNumbers ?? []) !== JSON.stringify(labels)
      ? "courts"
      : null,
    existing.estimatedCostCents !== (parsed.data.estimatedCostCents ?? null) ? "estimated cost" : null,
    existing.visibility !== parsed.data.visibility ? "visibility" : null,
    existing.notes !== (parsed.data.notes ?? null) ? "notes" : null,
    Boolean(existing.bookedAt) !== (formData.get("booked") === "on") ? "booking status" : null,
    existing.requiresApproval !== parsed.data.requiresApproval ? "join approval" : null,
  ].filter((value): value is string => Boolean(value));

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${existing.id} for update`);
      const current = await tx.query.sessions.findFirst({ where: eq(sessions.id, existing.id) });
      if (!current || current.version !== parsed.data.version) throw new Error("VERSION_CONFLICT");
      await tx
        .update(sessions)
        .set({
          title: parsed.data.title,
          accentColor: parsed.data.accentColor,
          venueName: parsed.data.venueName,
          venueAddress: parsed.data.venueAddress ?? null,
          startsAt: parsed.data.startsAt,
          endsAt: parsed.data.endsAt,
          capacity: parsed.data.capacity,
          courtCount: parsed.data.courtCount,
          courtNumbers: labels,
          notes: parsed.data.notes ?? null,
          estimatedCostCents: parsed.data.estimatedCostCents ?? null,
          visibility: parsed.data.visibility,
          requiresApproval: parsed.data.requiresApproval,
          bookedAt: formData.get("booked") === "on" ? (existing.bookedAt ?? new Date()) : null,
          bookingReference: parsed.data.bookingReference ?? null,
          bookingTotalCents: parsed.data.bookingTotalCents ?? null,
          bookingNotes: parsed.data.bookingNotes ?? null,
          version: current.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, existing.id));

      const existingCourts = await tx.select().from(courts).where(eq(courts.sessionId, existing.id));
      for (let index = 0; index < parsed.data.courtCount; index += 1) {
        const position = index + 1;
        const label = courtLabel(labels[index], position);
        const currentCourt = existingCourts.find((court) => court.position === position);
        if (currentCourt)
          await tx
            .update(courts)
            .set({ label, version: currentCourt.version + 1, updatedAt: new Date() })
            .where(eq(courts.id, currentCourt.id));
        else await tx.insert(courts).values({ sessionId: existing.id, label, position });
      }
      await tx
        .delete(courts)
        .where(and(eq(courts.sessionId, existing.id), gt(courts.position, parsed.data.courtCount)));

      if (changedFields.length) {
        await tx.insert(messages).values({
          sessionId: existing.id,
          authorId: user.id,
          kind: "system",
          body: `Game details updated: ${changedFields.join(", ")}.`,
        });
        const participants = await tx
          .select({ userId: sessionPlayers.userId })
          .from(sessionPlayers)
          .where(eq(sessionPlayers.sessionId, existing.id));
        const recipients = [
          ...new Set(
            participants.map(({ userId }) => userId).filter((id): id is string => Boolean(id) && id !== user.id),
          ),
        ];
        if (recipients.length)
          await tx.insert(notifications).values(
            recipients.map((userId) => ({
              userId,
              sessionId: existing.id,
              type: "session_details_changed",
              payload: { fields: changedFields },
            })),
          );
      }
    });
  } catch (error) {
    if (error instanceof Error && error.message === "VERSION_CONFLICT")
      return { error: "Someone else updated this game. Reload the page and review their changes before saving again." };
    console.error("Session update failed", error);
    return { error: "Game settings couldn’t be saved. Check your connection and try again.", values: savedValues };
  }

  revalidatePath("/home");
  revalidatePath("/games");
  revalidatePath(`/games/${existing.id}`);
  revalidatePath(`/games/${existing.id}/more`);
  revalidatePath(`/s/${existing.slug}`);
  redirect(`/games/${existing.id}`);
}

const rosterManagerInput = z.object({
  sessionId: z.uuid(),
  sessionPlayerId: z.uuid().optional(),
  playerEntry: z.string().trim().min(2, "Enter a guest name or @username.").max(60).optional(),
  skillLevel: z.enum(playingExperienceValues).optional(),
});

const relayUsernameInput = z
  .string()
  .trim()
  .toLowerCase()
  .min(3, "Relay usernames have at least 3 characters.")
  .max(24, "Relay usernames have at most 24 characters.")
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Enter a valid Relay username after @.");

async function requireSessionManager(sessionId: string, userId: string) {
  await assertRateLimit(
    { scope: "session-management", limit: 120, windowSeconds: 60 },
    `user:${userId}`,
    "Game changes are happening too quickly. Wait a moment and try again.",
  );
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  if (!session) return null;
  const membership = await db.query.sessionPlayers.findFirst({
    where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, userId)),
  });
  const actor = sessionActor({ userId, hostId: session.hostId, membership });
  return can(actor, "manage_roster") ? session : null;
}

export async function addPlayerAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const user = await requireUser();
  const parsed = rosterManagerInput.safeParse({
    sessionId: formData.get("sessionId"),
    playerEntry: formData.get("playerEntry"),
    skillLevel: formData.get("skillLevel") || undefined,
  });
  if (!parsed.success || !parsed.data.playerEntry)
    return { error: parsed.success ? "Enter a guest name or @username." : parsed.error.issues[0]?.message };
  const playerEntry = parsed.data.playerEntry;
  const session = await requireSessionManager(parsed.data.sessionId, user.id);
  if (!session) return { error: "Only a host or co-host can add players." };
  if (session.rosterLocked) return { error: "Unlock the roster before adding another player." };

  const isRelayInvite = playerEntry.startsWith("@");
  const username = isRelayInvite ? relayUsernameInput.safeParse(playerEntry.slice(1)) : null;
  if (username && !username.success) return { error: username.error.issues[0]?.message };
  const invitee =
    username?.success === true
      ? await db.query.profiles.findFirst({ where: eq(profiles.username, username.data) })
      : null;
  if (username?.success === true && !invitee) return { error: `No Relay player found for @${username.data}.` };
  if (invitee?.userId === user.id) return { error: "You’re already the host of this game." };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const roster = await tx.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));

      if (invitee) {
        const existing = roster.find((player) => player.userId === invitee.userId);
        if (existing && !existing.leftAt) throw new Error("ACCOUNT_ALREADY_ON_ROSTER");
        if (existing) {
          await tx
            .update(sessionPlayers)
            .set({
              skillLevel: invitee.skillLevel,
              role: "player",
              rsvp: "invited",
              playState: "unavailable",
              checkedInAt: null,
              waitlistPosition: null,
              respondedAt: null,
              leftAt: null,
            })
            .where(eq(sessionPlayers.id, existing.id));
        } else {
          await tx.insert(sessionPlayers).values({
            sessionId: session.id,
            userId: invitee.userId,
            skillLevel: invitee.skillLevel,
            role: "player",
            rsvp: "invited",
            playState: "unavailable",
          });
        }
        await tx.insert(notifications).values({
          userId: invitee.userId,
          sessionId: session.id,
          type: "session_invite",
          payload: {},
        });
        await tx.insert(messages).values({
          sessionId: session.id,
          authorId: user.id,
          kind: "system",
          body: `${invitee.name} was invited by the host.`,
        });
        return;
      }

      const guestName = playerEntry;
      const duplicate = roster.some(
        (player) =>
          !player.leftAt && player.guestName?.localeCompare(guestName, undefined, { sensitivity: "accent" }) === 0,
      );
      if (duplicate) throw new Error("DUPLICATE_GUEST");
      const transition = planRosterTransition({
        roster,
        capacity: session.capacity,
        intent: { requested: "going" },
      });
      const [player] = await tx
        .insert(sessionPlayers)
        .values({
          sessionId: session.id,
          guestName,
          skillLevel: parsed.data.skillLevel ?? null,
          role: "player",
          ...transition.target,
          respondedAt: new Date(),
        })
        .returning();
      if (session.status === "live" && transition.target.rsvp === "going") {
        const queue = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
        await tx.insert(sessionQueue).values({
          sessionId: session.id,
          sessionPlayerId: player.id,
          position: Math.max(0, ...queue.map((item) => item.position)) + 1,
          state: "waiting",
        });
      }
      await tx.insert(messages).values({
        sessionId: session.id,
        authorId: user.id,
        kind: "system",
        body: `${guestName} was added by the host.`,
      });
    });
  } catch (error) {
    if (
      (error instanceof Error && error.message === "ACCOUNT_ALREADY_ON_ROSTER") ||
      (invitee && typeof error === "object" && error !== null && "code" in error && error.code === "23505")
    )
      return { error: `${invitee?.name ?? "That player"} is already on the roster.` };
    if (error instanceof Error && error.message === "DUPLICATE_GUEST")
      return { error: "A guest with this name is already on the roster." };
    return {
      error: isRelayInvite ? "The invitation couldn’t be sent. Try again." : "The player couldn’t be added. Try again.",
    };
  }
  if (!isRelayInvite) await reconcileUnpaidExpenseShares(session.id);
  revalidatePath(`/games/${session.id}/players`);
  revalidatePath(`/games/${session.id}/payments`);
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/s/${session.slug}`);
  return { success: true, playerOutcome: isRelayInvite ? "invited" : "added" };
}

export async function approvePlayerAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const user = await requireUser();
  const parsed = rosterManagerInput.safeParse({
    sessionId: formData.get("sessionId"),
    sessionPlayerId: formData.get("sessionPlayerId"),
  });
  if (!parsed.success || !parsed.data.sessionPlayerId) return { error: "This join request could not be found." };
  const session = await requireSessionManager(parsed.data.sessionId, user.id);
  if (!session) return { error: "Only a host or co-host can approve players." };

  let result: "going" | "waitlisted" = "going";
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const roster = await tx.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));
      const player = roster.find((item) => item.id === parsed.data.sessionPlayerId && item.rsvp === "pending");
      if (!player) throw new Error("REQUEST_GONE");
      const transition = planRosterTransition({
        roster,
        capacity: session.capacity,
        intent: { playerId: player.id, requested: "going" },
      });
      if (transition.target.rsvp !== "going" && transition.target.rsvp !== "waitlisted")
        throw new Error("REQUEST_GONE");
      result = transition.target.rsvp;
      await tx
        .update(sessionPlayers)
        .set({ ...transition.target, respondedAt: new Date() })
        .where(eq(sessionPlayers.id, player.id));
      if (session.status === "live" && result === "going") {
        const queue = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
        await tx
          .insert(sessionQueue)
          .values({
            sessionId: session.id,
            sessionPlayerId: player.id,
            position: Math.max(0, ...queue.map((item) => item.position)) + 1,
            state: "waiting",
          })
          .onConflictDoNothing();
      }
      await tx.insert(messages).values({
        sessionId: session.id,
        authorId: user.id,
        kind: "system",
        body:
          result === "going"
            ? "A join request was approved."
            : "A join request was approved and moved to the waitlist.",
      });
      if (player.userId)
        await tx.insert(notifications).values({
          userId: player.userId,
          sessionId: session.id,
          type: result === "going" ? "join_approved" : "moved_to_waitlist",
          payload: {},
        });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "REQUEST_GONE")
      return { error: "This join request was already handled." };
    return { error: "The join request couldn’t be approved. Try again." };
  }
  await reconcileUnpaidExpenseShares(session.id);
  revalidatePath(`/games/${session.id}/players`);
  revalidatePath(`/games/${session.id}/payments`);
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/s/${session.slug}`);
  return { success: true, rsvp: result };
}

export async function removePlayerAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const user = await requireUser();
  const parsed = rosterManagerInput.safeParse({
    sessionId: formData.get("sessionId"),
    sessionPlayerId: formData.get("sessionPlayerId"),
  });
  if (!parsed.success || !parsed.data.sessionPlayerId) return { error: "This player could not be found." };
  const session = await requireSessionManager(parsed.data.sessionId, user.id);
  if (!session) return { error: "Only a host or co-host can remove players." };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const roster = await tx.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));
      const player = roster.find((item) => item.id === parsed.data.sessionPlayerId);
      if (!player || player.role === "host") throw new Error("CANNOT_REMOVE");
      const transition = planRosterTransition({
        roster,
        capacity: session.capacity,
        intent: { playerId: player.id, requested: "declined" },
      });
      await tx
        .update(sessionPlayers)
        .set({ ...transition.target, role: "player", checkedInAt: null, leftAt: new Date() })
        .where(eq(sessionPlayers.id, player.id));
      await tx
        .update(sessionQueue)
        .set({ state: "unavailable", version: sql`${sessionQueue.version} + 1` })
        .where(and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, player.id)));
      for (const update of transition.updates.filter((item) => item.id !== player.id))
        await tx
          .update(sessionPlayers)
          .set({ rsvp: update.rsvp, waitlistPosition: update.waitlistPosition, playState: update.playState })
          .where(eq(sessionPlayers.id, update.id));
      for (const promotedId of transition.promotedPlayerIds) {
        if (session.status === "live") {
          const queue = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
          const position = Math.max(0, ...queue.map((item) => item.position)) + 1;
          await tx
            .insert(sessionQueue)
            .values({
              sessionId: session.id,
              sessionPlayerId: promotedId,
              position,
              state: "waiting",
            })
            .onConflictDoUpdate({
              target: [sessionQueue.sessionId, sessionQueue.sessionPlayerId],
              set: { state: "waiting", position, enteredAt: new Date(), version: sql`${sessionQueue.version} + 1` },
            });
        }
        const promoted = roster.find((item) => item.id === promotedId);
        if (promoted?.userId)
          await tx
            .insert(notifications)
            .values({ userId: promoted.userId, sessionId: session.id, type: "moved_from_waitlist", payload: {} });
      }
      await tx.insert(messages).values({
        sessionId: session.id,
        authorId: user.id,
        kind: "system",
        body: "The host updated the player roster.",
      });
      if (player.userId)
        await tx
          .insert(notifications)
          .values({ userId: player.userId, sessionId: session.id, type: "removed_from_session", payload: {} });
    });
  } catch {
    return { error: "This player can’t be removed from the roster." };
  }
  await reconcileUnpaidExpenseShares(session.id);
  revalidatePath(`/games/${session.id}/players`);
  revalidatePath(`/games/${session.id}/payments`);
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/s/${session.slug}`);
  return { success: true };
}

export async function markSessionBookedAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const session = await requireSessionManager(sessionId, user.id);
  if (!session) throw new Error("Only a host or co-host can confirm the booking");
  if (!session.bookedAt) {
    await db
      .update(sessions)
      .set({ bookedAt: new Date(), version: session.version + 1, updatedAt: new Date() })
      .where(and(eq(sessions.id, session.id), eq(sessions.version, session.version)));
    await db
      .insert(messages)
      .values({ sessionId: session.id, authorId: user.id, kind: "system", body: "Court booking confirmed." });
    const participants = await db
      .select({ userId: sessionPlayers.userId })
      .from(sessionPlayers)
      .where(eq(sessionPlayers.sessionId, session.id));
    const recipients = [
      ...new Set(participants.map(({ userId }) => userId).filter((id): id is string => Boolean(id) && id !== user.id)),
    ];
    if (recipients.length)
      await db
        .insert(notifications)
        .values(
          recipients.map((userId) => ({ userId, sessionId: session.id, type: "booking_confirmed", payload: {} })),
        );
  }
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/s/${session.slug}`);
}

export async function toggleRosterLockAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const session = await requireSessionManager(sessionId, user.id);
  if (!session) throw new Error("Only a host or co-host can lock the roster");
  await db
    .update(sessions)
    .set({ rosterLocked: !session.rosterLocked, version: session.version + 1, updatedAt: new Date() })
    .where(and(eq(sessions.id, session.id), eq(sessions.version, session.version)));
  revalidatePath(`/games/${session.id}/players`);
  revalidatePath(`/s/${session.slug}`);
}

const attendanceInput = z.object({
  sessionId: z.uuid(),
  sessionPlayerId: z.uuid(),
  present: z.enum(["true", "false"]).transform((value) => value === "true"),
});

export type AttendanceActionState = { error?: string; success?: boolean };

export async function setAttendanceAction(
  _: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const parsed = attendanceInput.safeParse({
    sessionId: formData.get("sessionId"),
    sessionPlayerId: formData.get("sessionPlayerId"),
    present: formData.get("present"),
  });
  if (!parsed.success) return { error: "This player could not be updated." };
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, parsed.data.sessionId) });
  if (!session || !["draft", "published", "live"].includes(session.status))
    return { error: "Check-in is closed for this game." };
  const target = await db.query.sessionPlayers.findFirst({
    where: and(eq(sessionPlayers.id, parsed.data.sessionPlayerId), eq(sessionPlayers.sessionId, parsed.data.sessionId)),
  });
  if (!target || target.rsvp !== "going") return { error: "Only going players can check in." };

  const user = await getCurrentUser();
  const manager = user ? await requireSessionManager(session.id, user.id) : null;
  let isSelf = Boolean(user && target.userId === user.id);
  if (!user && target.guestTokenHash) {
    const guestToken = (await cookies()).get(`relay_guest_${session.id}`)?.value;
    if (guestToken) {
      const guestHash = await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(guestToken))
        .then((value) => Buffer.from(value).toString("hex"));
      isSelf = guestHash === target.guestTokenHash;
    }
  }
  if (!manager && !isSelf) return { error: "You can only update your own arrival." };
  if (!manager) {
    const limit = await checkRateLimit(
      { scope: "attendance-self", limit: 30, windowSeconds: 60 },
      `player:${target.id}`,
    );
    if (!limit.allowed) return { error: "Arrival is changing too quickly. Wait a moment and try again." };
  }

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const currentQueue = await tx.query.sessionQueue.findFirst({
        where: and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, target.id)),
      });
      if (!parsed.data.present && currentQueue?.state === "playing") throw new Error("PLAYER_ACTIVE");

      await tx
        .update(sessionPlayers)
        .set({
          checkedInAt: parsed.data.present ? new Date() : null,
          playState: parsed.data.present ? (session.status === "live" ? "waiting" : "available") : "unavailable",
          updatedAt: new Date(),
        })
        .where(eq(sessionPlayers.id, target.id));

      if (session.status === "live") {
        if (parsed.data.present && !currentQueue) {
          const queue = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
          await tx.insert(sessionQueue).values({
            sessionId: session.id,
            sessionPlayerId: target.id,
            position: Math.max(0, ...queue.map((item) => item.position)) + 1,
            state: "waiting",
          });
        } else if (currentQueue) {
          await tx
            .update(sessionQueue)
            .set({
              state: parsed.data.present ? "waiting" : "unavailable",
              enteredAt: parsed.data.present ? new Date() : currentQueue.enteredAt,
              version: sql`${sessionQueue.version} + 1`,
            })
            .where(and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, target.id)));
        }
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message === "PLAYER_ACTIVE"
          ? "Finish this player’s active match before marking them unavailable."
          : "Arrival status could not be saved. Try again.",
    };
  }

  revalidatePath(`/games/${session.id}/play`);
  revalidatePath(`/games/${session.id}/play/setup`);
  revalidatePath(`/s/${session.slug}/play`);
  return { success: true };
}

export async function setAllAttendanceAction(
  _: AttendanceActionState,
  formData: FormData,
): Promise<AttendanceActionState> {
  const parsed = z
    .object({
      sessionId: z.uuid(),
      present: z.enum(["true", "false"]).transform((value) => value === "true"),
    })
    .safeParse({ sessionId: formData.get("sessionId"), present: formData.get("present") });
  if (!parsed.success) return { error: "Arrival status could not be updated." };

  const user = await requireUser();
  const session = await requireSessionManager(parsed.data.sessionId, user.id);
  if (!session) return { error: "Only a host or co-host can update everyone’s arrival." };
  if (!["draft", "published", "live"].includes(session.status)) return { error: "Check-in is closed for this game." };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const going = await tx
        .select({ id: sessionPlayers.id })
        .from(sessionPlayers)
        .where(and(eq(sessionPlayers.sessionId, session.id), eq(sessionPlayers.rsvp, "going")));
      const playerIds = going.map(({ id }) => id);
      if (!playerIds.length) return;

      const queue =
        session.status === "live"
          ? await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id))
          : [];
      if (
        !parsed.data.present &&
        queue.some((item) => playerIds.includes(item.sessionPlayerId) && item.state === "playing")
      )
        throw new Error("PLAYER_ACTIVE");

      const playingIds = new Set(queue.filter((item) => item.state === "playing").map((item) => item.sessionPlayerId));
      const updateIds = parsed.data.present ? playerIds.filter((id) => !playingIds.has(id)) : playerIds;
      if (updateIds.length)
        await tx
          .update(sessionPlayers)
          .set({
            checkedInAt: parsed.data.present ? new Date() : null,
            playState: parsed.data.present ? (session.status === "live" ? "waiting" : "available") : "unavailable",
            updatedAt: new Date(),
          })
          .where(inArray(sessionPlayers.id, updateIds));

      if (session.status === "live") {
        const existingIds = new Set(queue.map((item) => item.sessionPlayerId));
        const additions = parsed.data.present
          ? playerIds
              .filter((id) => !existingIds.has(id))
              .map((sessionPlayerId, index) => ({
                sessionId: session.id,
                sessionPlayerId,
                position: queue.length + index + 1,
                state: "waiting" as const,
              }))
          : [];
        if (additions.length) await tx.insert(sessionQueue).values(additions);
        await tx
          .update(sessionQueue)
          .set({
            state: parsed.data.present ? "waiting" : "unavailable",
            version: sql`${sessionQueue.version} + 1`,
          })
          .where(
            and(
              eq(sessionQueue.sessionId, session.id),
              inArray(sessionQueue.sessionPlayerId, playerIds),
              ne(sessionQueue.state, "playing"),
            ),
          );
      }
    });
  } catch (error) {
    return {
      error:
        error instanceof Error && error.message === "PLAYER_ACTIVE"
          ? "Finish active matches before marking everyone not here."
          : "Arrival status could not be updated. Try again.",
    };
  }

  revalidatePath(`/games/${session.id}/play`);
  revalidatePath(`/games/${session.id}/play/setup`);
  revalidatePath(`/s/${session.slug}/play`);
  return { success: true };
}

const rsvpInput = z.object({
  sessionId: z.uuid(),
  choice: z.enum(["going", "maybe", "declined"]),
  guestName: z.string().trim().min(2).max(60).optional(),
  skillLevel: z.enum(playingExperienceValues).optional(),
});

export async function rsvpAction(_: SessionActionState, formData: FormData): Promise<SessionActionState> {
  const parsed = rsvpInput.safeParse({
    sessionId: formData.get("sessionId"),
    choice: formData.get("choice"),
    guestName: formData.get("guestName") || undefined,
    skillLevel: formData.get("skillLevel") || undefined,
  });
  if (!parsed.success) return { error: "Add your name before responding." };
  const session = await db.query.sessions.findFirst({
    where: and(eq(sessions.id, parsed.data.sessionId), inArray(sessions.status, ["published", "live"])),
  });
  if (!session || session.rosterLocked)
    return {
      error: session?.rosterLocked
        ? "The host has locked this roster."
        : "This session is no longer accepting responses.",
    };
  const user = await getCurrentUser();
  const cookieStore = await cookies();
  const guestToken = cookieStore.get(`relay_guest_${session.id}`)?.value;
  const guestHash = guestToken
    ? await crypto.subtle
        .digest("SHA-256", new TextEncoder().encode(guestToken))
        .then((value) => Buffer.from(value).toString("hex"))
    : null;
  const limit = await checkRateLimit(
    { scope: "session-rsvp", limit: 20, windowSeconds: 600 },
    user ? `user:${user.id}` : guestHash ? `guest:${guestHash}` : await requestIdentity(),
  );
  if (!limit.allowed) return { error: "Responses are being updated too quickly. Wait a moment and try again." };
  if (!user && !parsed.data.guestName && !guestToken) return { error: "Add your name before responding." };
  const accountProfile = user
    ? await db.query.profiles.findFirst({ columns: { skillLevel: true }, where: eq(profiles.userId, user.id) })
    : null;
  const selectedExperience = parsed.data.skillLevel ?? accountProfile?.skillLevel ?? null;
  let newGuestToken: string | null = null;
  let resolvedRsvp: SessionActionState["rsvp"];

  try {
    newGuestToken = await db.transaction(async (tx): Promise<string | null> => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const current = await tx.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));
      let identity = findRosterIdentity(current, { userId: user?.id, guestTokenHash: guestHash });
      const claimingGuest =
        !identity && !user && parsed.data.guestName
          ? current.find(
              (player) =>
                !player.userId &&
                !player.guestTokenHash &&
                !player.leftAt &&
                player.guestName?.localeCompare(parsed.data.guestName!, undefined, { sensitivity: "accent" }) === 0,
            )
          : undefined;
      if (claimingGuest) identity = claimingGuest;
      const transition = planRosterTransition({
        roster: current,
        capacity: session.capacity,
        intent: {
          playerId: identity?.id,
          requested: parsed.data.choice,
          requiresApproval: session.requiresApproval,
        },
      });
      const nextRsvp = transition.target.rsvp;
      resolvedRsvp = nextRsvp;
      let createdToken: string | null = null;
      let actorPlayerId = identity?.id;
      if (identity) {
        createdToken = claimingGuest ? crypto.randomUUID() : null;
        const claimedTokenHash = createdToken
          ? await crypto.subtle
              .digest("SHA-256", new TextEncoder().encode(createdToken))
              .then((value) => Buffer.from(value).toString("hex"))
          : identity.guestTokenHash;
        await tx
          .update(sessionPlayers)
          .set({
            guestTokenHash: claimedTokenHash,
            skillLevel: selectedExperience ?? identity.skillLevel,
            ...transition.target,
            respondedAt: new Date(),
            checkedInAt: nextRsvp === "going" ? identity.checkedInAt : null,
          })
          .where(eq(sessionPlayers.id, identity.id));
      } else {
        createdToken = user ? null : crypto.randomUUID();
        const tokenHash = createdToken
          ? await crypto.subtle
              .digest("SHA-256", new TextEncoder().encode(createdToken))
              .then((value) => Buffer.from(value).toString("hex"))
          : null;
        const [createdPlayer] = await tx
          .insert(sessionPlayers)
          .values({
            sessionId: session.id,
            userId: user?.id,
            guestName: user ? null : parsed.data.guestName,
            guestTokenHash: tokenHash,
            skillLevel: selectedExperience,
            ...transition.target,
            respondedAt: new Date(),
          })
          .returning({ id: sessionPlayers.id });
        actorPlayerId = createdPlayer.id;
      }
      if (nextRsvp === "pending" && actorPlayerId)
        await tx.insert(notifications).values({
          userId: session.hostId,
          sessionId: session.id,
          type: "join_request",
          payload: { sessionPlayerId: actorPlayerId, guestName: user ? null : (parsed.data.guestName ?? null) },
        });
      if (nextRsvp === "going" && identity?.rsvp !== "going" && user?.id !== session.hostId)
        await tx.insert(notifications).values({
          userId: session.hostId,
          sessionId: session.id,
          type: "player_joined",
          payload: { guestName: user ? null : (parsed.data.guestName ?? null) },
        });
      if (identity?.rsvp === "going" && nextRsvp !== "going" && user?.id !== session.hostId)
        await tx.insert(notifications).values({
          userId: session.hostId,
          sessionId: session.id,
          type: "player_left",
          payload: { guestName: user ? null : (parsed.data.guestName ?? identity.guestName ?? null) },
        });
      if (session.status === "live" && actorPlayerId) {
        const queueEntry = await tx.query.sessionQueue.findFirst({
          where: and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, actorPlayerId)),
        });
        if (nextRsvp === "going" && !queueEntry) {
          const currentQueue = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
          await tx.insert(sessionQueue).values({
            sessionId: session.id,
            sessionPlayerId: actorPlayerId,
            position: Math.max(0, ...currentQueue.map((item) => item.position)) + 1,
            state: "waiting",
          });
        } else if (nextRsvp === "going" && queueEntry) {
          await tx
            .update(sessionQueue)
            .set({ state: "waiting" })
            .where(and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, actorPlayerId)));
        } else if (nextRsvp !== "going" && queueEntry)
          await tx
            .update(sessionQueue)
            .set({ state: "unavailable" })
            .where(and(eq(sessionQueue.sessionId, session.id), eq(sessionQueue.sessionPlayerId, actorPlayerId)));
      }
      for (const update of transition.updates.filter((item) => item.id !== actorPlayerId))
        await tx
          .update(sessionPlayers)
          .set({ rsvp: update.rsvp, waitlistPosition: update.waitlistPosition, playState: update.playState })
          .where(eq(sessionPlayers.id, update.id));
      for (const promotedId of transition.promotedPlayerIds) {
        if (session.status === "live") {
          const queue = await tx.select().from(sessionQueue).where(eq(sessionQueue.sessionId, session.id));
          const position = Math.max(0, ...queue.map((item) => item.position)) + 1;
          await tx
            .insert(sessionQueue)
            .values({
              sessionId: session.id,
              sessionPlayerId: promotedId,
              position,
              state: "waiting",
            })
            .onConflictDoUpdate({
              target: [sessionQueue.sessionId, sessionQueue.sessionPlayerId],
              set: { state: "waiting", position, enteredAt: new Date(), version: sql`${sessionQueue.version} + 1` },
            });
        }
        const promoted = current.find((item) => item.id === promotedId);
        if (promoted?.userId)
          await tx
            .insert(notifications)
            .values({ userId: promoted.userId, sessionId: session.id, type: "moved_from_waitlist", payload: {} });
      }
      return createdToken;
    });
  } catch (error) {
    console.error("RSVP mutation failed", error);
    return { error: "Your response couldn’t be saved. Check your connection and try again." };
  }
  if (newGuestToken)
    cookieStore.set(`relay_guest_${session.id}`, newGuestToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 90,
      path: "/",
    });
  await reconcileUnpaidExpenseShares(session.id);
  await trackProductEvent({
    name: "rsvp_saved",
    userId: user?.id,
    sessionId: session.id,
    source: user ? "authenticated" : "guest",
    metadata: { response: resolvedRsvp ?? "unknown" },
  });
  revalidatePath(`/games/${session.id}/payments`);
  revalidatePath(`/s/${session.slug}`);
  return { success: true, rsvp: resolvedRsvp };
}
