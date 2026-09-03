import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { messages, notifications, profiles, sessionPlayers, sessionQueue, sessions } from "@/db/schema";
import { trackSessionMilestone } from "@/features/analytics/events";
import { can, sessionActor } from "@/features/auth/permissions";
import { reconcileUnpaidExpenseShares } from "@/features/payments/sync";
import type { PlayingExperience } from "@/features/players/playing-experience";
import { assertRateLimit } from "@/lib/rate-limit";

import { planRosterTransition } from "./roster";

export type RosterManagementCommand =
  | {
      type: "add";
      actorUserId: string;
      sessionId: string;
      playerEntry: string;
      skillLevel?: PlayingExperience;
    }
  | { type: "approve"; actorUserId: string; sessionId: string; sessionPlayerId: string }
  | { type: "remove"; actorUserId: string; sessionId: string; sessionPlayerId: string };

export type RosterManagementResult = {
  error?: string;
  success?: boolean;
  playerOutcome?: "added" | "invited";
  rsvp?: "going" | "waitlisted";
};

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

function invalidateRoster(session: { id: string; slug: string }) {
  revalidatePath("/home");
  revalidatePath("/notifications");
  revalidatePath(`/games/${session.id}/players`);
  revalidatePath(`/games/${session.id}/payments`);
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/s/${session.slug}`);
}

function unresolvedJoinRequest(sessionId: string, hostId: string, sessionPlayerId: string) {
  return and(
    eq(notifications.userId, hostId),
    eq(notifications.sessionId, sessionId),
    eq(notifications.type, "join_request"),
    isNull(notifications.readAt),
    sql`${notifications.payload} ->> 'sessionPlayerId' = ${sessionPlayerId}`,
  );
}

async function addPlayer(command: Extract<RosterManagementCommand, { type: "add" }>): Promise<RosterManagementResult> {
  const session = await requireSessionManager(command.sessionId, command.actorUserId);
  if (!session) return { error: "Only a host or co-host can add players." };
  if (session.rosterLocked) return { error: "Unlock the roster before adding another player." };

  const isRelayInvite = command.playerEntry.startsWith("@");
  const username = isRelayInvite ? relayUsernameInput.safeParse(command.playerEntry.slice(1)) : null;
  if (username && !username.success) return { error: username.error.issues[0]?.message };
  const invitee =
    username?.success === true
      ? await db.query.profiles.findFirst({ where: eq(profiles.username, username.data) })
      : null;
  if (username?.success === true && !invitee) return { error: `No Relay player found for @${username.data}.` };
  if (invitee?.userId === command.actorUserId) return { error: "You’re already the host of this game." };
  const hostProfile = invitee
    ? await db.query.profiles.findFirst({ columns: { name: true }, where: eq(profiles.userId, session.hostId) })
    : null;
  let reachedFourthPlayer = false;

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
          payload: {
            hostName: hostProfile?.name ?? "The host",
            startsAt: session.startsAt.toISOString(),
            venueName: session.venueName,
          },
        });
        await tx.insert(messages).values({
          sessionId: session.id,
          authorId: command.actorUserId,
          kind: "system",
          body: `${invitee.name} was invited by the host.`,
        });
        return;
      }

      const guestName = command.playerEntry;
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
      const goingBefore = roster.filter((player) => player.rsvp === "going").length;
      reachedFourthPlayer = goingBefore < 4 && goingBefore + Number(transition.target.rsvp === "going") >= 4;
      const [player] = await tx
        .insert(sessionPlayers)
        .values({
          sessionId: session.id,
          guestName,
          skillLevel: command.skillLevel ?? null,
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
        authorId: command.actorUserId,
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

  if (!isRelayInvite)
    await Promise.all([
      reconcileUnpaidExpenseShares(session.id),
      ...(reachedFourthPlayer
        ? [
            trackSessionMilestone({
              name: "fourth_player_joined",
              userId: command.actorUserId,
              sessionId: session.id,
              source: "authenticated",
            }),
          ]
        : []),
    ]);
  invalidateRoster(session);
  return { success: true, playerOutcome: isRelayInvite ? "invited" : "added" };
}

async function approvePlayer(
  command: Extract<RosterManagementCommand, { type: "approve" }>,
): Promise<RosterManagementResult> {
  const session = await requireSessionManager(command.sessionId, command.actorUserId);
  if (!session) return { error: "Only a host or co-host can approve players." };

  let result: "going" | "waitlisted" = "going";
  let reachedFourthPlayer = false;
  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const roster = await tx.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));
      const player = roster.find((item) => item.id === command.sessionPlayerId && item.rsvp === "pending");
      if (!player) throw new Error("REQUEST_GONE");
      const transition = planRosterTransition({
        roster,
        capacity: session.capacity,
        intent: { playerId: player.id, requested: "going" },
      });
      if (transition.target.rsvp !== "going" && transition.target.rsvp !== "waitlisted")
        throw new Error("REQUEST_GONE");
      result = transition.target.rsvp;
      const goingBefore = roster.filter((item) => item.rsvp === "going").length;
      reachedFourthPlayer = goingBefore < 4 && goingBefore + Number(result === "going") >= 4;
      await tx
        .update(sessionPlayers)
        .set({ ...transition.target, respondedAt: new Date() })
        .where(eq(sessionPlayers.id, player.id));
      await tx
        .update(notifications)
        .set({ readAt: new Date() })
        .where(unresolvedJoinRequest(session.id, session.hostId, player.id));
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
        authorId: command.actorUserId,
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

  await Promise.all([
    reconcileUnpaidExpenseShares(session.id),
    ...(reachedFourthPlayer
      ? [
          trackSessionMilestone({
            name: "fourth_player_joined",
            userId: command.actorUserId,
            sessionId: session.id,
            source: "authenticated",
          }),
        ]
      : []),
  ]);
  invalidateRoster(session);
  return { success: true, rsvp: result };
}

async function removePlayer(
  command: Extract<RosterManagementCommand, { type: "remove" }>,
): Promise<RosterManagementResult> {
  const session = await requireSessionManager(command.sessionId, command.actorUserId);
  if (!session) return { error: "Only a host or co-host can remove players." };

  try {
    await db.transaction(async (tx) => {
      await tx.execute(sql`select id from ${sessions} where id = ${session.id} for update`);
      const roster = await tx.select().from(sessionPlayers).where(eq(sessionPlayers.sessionId, session.id));
      const player = roster.find((item) => item.id === command.sessionPlayerId);
      if (!player || player.role === "host") throw new Error("CANNOT_REMOVE");
      const pendingRequest = player.rsvp === "pending";
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
          await tx.insert(notifications).values({
            userId: promoted.userId,
            sessionId: session.id,
            type: "moved_from_waitlist",
            payload: {},
          });
      }
      await tx.insert(messages).values({
        sessionId: session.id,
        authorId: command.actorUserId,
        kind: "system",
        body: "The host updated the player roster.",
      });
      if (player.userId)
        await tx.insert(notifications).values({
          userId: player.userId,
          sessionId: session.id,
          type: "removed_from_session",
          payload: {},
        });
      if (pendingRequest)
        await tx
          .update(notifications)
          .set({ readAt: new Date() })
          .where(unresolvedJoinRequest(session.id, session.hostId, player.id));
    });
  } catch {
    return { error: "This player can’t be removed from the roster." };
  }

  await reconcileUnpaidExpenseShares(session.id);
  invalidateRoster(session);
  return { success: true };
}

export async function manageRoster(command: RosterManagementCommand): Promise<RosterManagementResult> {
  if (command.type === "add") return addPlayer(command);
  if (command.type === "approve") return approvePlayer(command);
  return removePlayer(command);
}
