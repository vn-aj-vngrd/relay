"use server";

import { and, eq, inArray, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import {
  messages,
  notifications,
  profiles,
  sessionPlayers,
  sessions,
} from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { assertRateLimit } from "@/lib/rate-limit";

export type OrganizerActionState = { error?: string; message?: string };

const inputSchema = z.object({
  sessionId: z.uuid(),
  version: z.coerce.number().int().positive(),
  leadOrganizerId: z.union([z.uuid(), z.literal("")]),
});

const addCohostInputSchema = z.object({
  sessionId: z.uuid(),
  version: z.coerce.number().int().positive(),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .transform((value) => value.replace(/^@/, ""))
    .pipe(
      z
        .string()
        .min(3, "Enter a Relay username with at least 3 characters.")
        .max(24, "Relay usernames have at most 24 characters.")
        .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Enter a valid Relay username.")
    ),
});

const cohostInputSchema = z.object({
  sessionId: z.uuid(),
  version: z.coerce.number().int().positive(),
  sessionPlayerId: z.uuid(),
  role: z.enum(["player", "cohost"]),
});

const organizerRateLimit = {
  scope: "organizer-management",
  limit: 30,
  windowSeconds: 60,
} as const;

const organizerRateLimitMessage =
  "Organizer changes are happening too quickly. Wait and try again.";

export async function setLeadOrganizerAction(
  _: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const user = await requireUser();
  await assertRateLimit(
    organizerRateLimit,
    `user:${user.id}`,
    organizerRateLimitMessage
  );
  const parsed = inputSchema.safeParse({
    sessionId: formData.get("sessionId"),
    version: formData.get("version"),
    leadOrganizerId: formData.get("leadOrganizerId") ?? "",
  });
  if (!parsed.success)
    return { error: "Choose a current co-host and try again." };
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, parsed.data.sessionId),
  });
  if (!session || session.hostId !== user.id)
    return { error: "Only the host can choose the lead organizer." };

  const lead = parsed.data.leadOrganizerId
    ? await db.query.sessionPlayers.findFirst({
        where: and(
          eq(sessionPlayers.sessionId, session.id),
          eq(sessionPlayers.userId, parsed.data.leadOrganizerId),
          eq(sessionPlayers.role, "cohost")
        ),
      })
    : null;
  if (parsed.data.leadOrganizerId && !lead)
    return { error: "That player is no longer a co-host." };

  const updated = await db.transaction(async (tx) => {
    await tx.execute(
      sql`select id from ${sessions} where id = ${session.id} for update`
    );
    const [changed] = await tx
      .update(sessions)
      .set({
        leadOrganizerId: lead?.userId ?? null,
        version: sql`${sessions.version} + 1`,
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.id, session.id),
          eq(sessions.version, parsed.data.version)
        )
      )
      .returning({ id: sessions.id });
    if (!changed) return false;
    await tx.insert(messages).values({
      sessionId: session.id,
      kind: "system",
      body: lead
        ? "The host assigned a lead organizer for Play."
        : "The host removed the lead organizer assignment.",
    });
    return true;
  });
  if (!updated)
    return {
      error: "The game changed on another device. Refresh and try again.",
    };
  revalidatePath(`/games/${session.id}/settings`);
  revalidatePath(`/games/${session.id}/play`);
  revalidatePath(`/s/${session.slug}/play`);
  return {
    message: lead ? "Lead organizer assigned." : "Lead organizer removed.",
  };
}

export async function addCohostAction(
  _: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const user = await requireUser();
  await assertRateLimit(
    organizerRateLimit,
    `user:${user.id}`,
    organizerRateLimitMessage
  );
  const parsed = addCohostInputSchema.safeParse({
    sessionId: formData.get("sessionId"),
    version: formData.get("version"),
    username: formData.get("username"),
  });
  if (!parsed.success)
    return {
      error: parsed.error.issues[0]?.message ?? "Enter a Relay username.",
    };

  const [session, profile] = await Promise.all([
    db.query.sessions.findFirst({
      where: eq(sessions.id, parsed.data.sessionId),
    }),
    db.query.profiles.findFirst({
      where: eq(profiles.username, parsed.data.username),
    }),
  ]);
  if (!session || session.hostId !== user.id)
    return { error: "Only the host can add a co-host." };
  if (session.status !== "draft" && session.status !== "published")
    return { error: "Co-host access can only be changed before Play starts." };
  if (!profile)
    return { error: `No Relay member found for @${parsed.data.username}.` };
  if (profile.userId === session.hostId)
    return { error: "You’re already the host of this game." };

  const now = new Date();
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${session.id} for update`
      );
      const [existing] = await tx
        .select({
          id: sessionPlayers.id,
          role: sessionPlayers.role,
          leftAt: sessionPlayers.leftAt,
        })
        .from(sessionPlayers)
        .where(
          and(
            eq(sessionPlayers.sessionId, session.id),
            eq(sessionPlayers.userId, profile.userId)
          )
        );
      if (existing?.role === "host") return "INVALID_TARGET" as const;
      if (existing?.role === "cohost" && !existing.leftAt)
        return "ALREADY_COHOST" as const;

      const [changedSession] = await tx
        .update(sessions)
        .set({
          version: sql`${sessions.version} + 1`,
          updatedAt: now,
        })
        .where(
          and(
            eq(sessions.id, session.id),
            eq(sessions.hostId, user.id),
            eq(sessions.version, parsed.data.version),
            inArray(sessions.status, ["draft", "published"])
          )
        )
        .returning({ id: sessions.id });
      if (!changedSession) return "CONFLICT" as const;

      if (existing) {
        await tx
          .update(sessionPlayers)
          .set({
            role: "cohost",
            ...(existing.leftAt
              ? {
                  rsvp: "declined" as const,
                  playState: "unavailable" as const,
                  checkedInAt: null,
                  waitlistPosition: null,
                  respondedAt: now,
                  leftAt: null,
                }
              : {}),
            updatedAt: now,
          })
          .where(eq(sessionPlayers.id, existing.id));
      } else {
        await tx.insert(sessionPlayers).values({
          sessionId: session.id,
          userId: profile.userId,
          skillLevel: profile.skillLevel,
          role: "cohost",
          rsvp: "declined",
          playState: "unavailable",
          respondedAt: now,
        });
      }

      await tx.insert(messages).values({
        sessionId: session.id,
        kind: "system",
        body: "The host assigned a co-host.",
      });
      await tx.insert(notifications).values({
        userId: profile.userId,
        sessionId: session.id,
        type: "cohost_assigned",
        payload: {},
      });
      return "UPDATED" as const;
    });

    if (result === "INVALID_TARGET")
      return { error: "That account cannot be added as a co-host." };
    if (result === "ALREADY_COHOST")
      return { error: `@${parsed.data.username} is already a co-host.` };
    if (result === "CONFLICT")
      return {
        error: "The game changed on another device. Refresh and try again.",
      };
  } catch (error) {
    console.error(
      "Co-host assignment failed",
      error instanceof Error ? error.name : "UnknownError"
    );
    return { error: "The co-host couldn’t be added. Try again." };
  }

  revalidatePath("/home");
  revalidatePath("/games");
  revalidatePath("/notifications");
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/games/${session.id}/players`);
  revalidatePath(`/games/${session.id}/settings`);
  revalidatePath(`/s/${session.slug}`);
  revalidatePath(`/s/${session.slug}/players`);
  return { message: `@${parsed.data.username} added as a co-host.` };
}

export async function setCohostRoleAction(
  _: OrganizerActionState,
  formData: FormData
): Promise<OrganizerActionState> {
  const user = await requireUser();
  await assertRateLimit(
    organizerRateLimit,
    `user:${user.id}`,
    organizerRateLimitMessage
  );
  const parsed = cohostInputSchema.safeParse({
    sessionId: formData.get("sessionId"),
    version: formData.get("version"),
    sessionPlayerId: formData.get("sessionPlayerId"),
    role: formData.get("role"),
  });
  if (!parsed.success)
    return { error: "Choose a current player and try again." };

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, parsed.data.sessionId),
  });
  if (!session || session.hostId !== user.id)
    return { error: "Only the host can change co-host access." };
  if (session.status !== "draft" && session.status !== "published")
    return { error: "Co-host access can only be changed before Play starts." };

  const desiredRole = parsed.data.role;
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${session.id} for update`
      );
      const [target] = await tx
        .select({
          id: sessionPlayers.id,
          userId: sessionPlayers.userId,
          role: sessionPlayers.role,
          leftAt: sessionPlayers.leftAt,
        })
        .from(sessionPlayers)
        .where(
          and(
            eq(sessionPlayers.id, parsed.data.sessionPlayerId),
            eq(sessionPlayers.sessionId, session.id)
          )
        );
      if (
        !target?.userId ||
        target.leftAt ||
        target.role === "host" ||
        target.userId === session.hostId
      )
        return "INVALID_TARGET" as const;
      if (target.role === desiredRole) return "ALREADY_SET" as const;
      if (target.role !== (desiredRole === "cohost" ? "player" : "cohost"))
        return "INVALID_TARGET" as const;

      const [changedSession] = await tx
        .update(sessions)
        .set({
          ...(desiredRole === "player" &&
          session.leadOrganizerId === target.userId
            ? { leadOrganizerId: null }
            : {}),
          version: sql`${sessions.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(sessions.id, session.id),
            eq(sessions.hostId, user.id),
            eq(sessions.version, parsed.data.version),
            inArray(sessions.status, ["draft", "published"])
          )
        )
        .returning({ id: sessions.id });
      if (!changedSession) return "CONFLICT" as const;

      const [changedPlayer] = await tx
        .update(sessionPlayers)
        .set({ role: desiredRole, updatedAt: new Date() })
        .where(
          and(
            eq(sessionPlayers.id, target.id),
            eq(sessionPlayers.sessionId, session.id),
            eq(sessionPlayers.userId, target.userId),
            eq(sessionPlayers.role, target.role),
            isNull(sessionPlayers.leftAt)
          )
        )
        .returning({ id: sessionPlayers.id });
      if (!changedPlayer) throw new Error("COHOST_TARGET_CHANGED");

      await tx.insert(messages).values({
        sessionId: session.id,
        kind: "system",
        body:
          desiredRole === "cohost"
            ? "The host assigned a co-host."
            : "The host removed a co-host.",
      });
      await tx.insert(notifications).values({
        userId: target.userId,
        sessionId: session.id,
        type: desiredRole === "cohost" ? "cohost_assigned" : "cohost_removed",
        payload: {},
      });
      return "UPDATED" as const;
    });

    if (result === "INVALID_TARGET")
      return { error: "Choose an active Relay player or co-host." };
    if (result === "ALREADY_SET")
      return {
        error:
          desiredRole === "cohost"
            ? "That player is already a co-host."
            : "That co-host is already a player.",
      };
    if (result === "CONFLICT")
      return {
        error: "The game changed on another device. Refresh and try again.",
      };
  } catch (error) {
    if (error instanceof Error && error.message === "COHOST_TARGET_CHANGED")
      return {
        error: "The game changed on another device. Refresh and try again.",
      };
    console.error(
      "Co-host access change failed",
      error instanceof Error ? error.name : "UnknownError"
    );
    return { error: "Co-host access couldn’t be changed. Try again." };
  }

  revalidatePath("/home");
  revalidatePath("/games");
  revalidatePath("/games/open");
  revalidatePath("/notifications");
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/games/${session.id}/players`);
  revalidatePath(`/games/${session.id}/settings`);
  revalidatePath(`/s/${session.slug}`);
  revalidatePath(`/s/${session.slug}/players`);
  return {
    message:
      desiredRole === "cohost"
        ? "Co-host access assigned."
        : "Co-host access removed.",
  };
}
