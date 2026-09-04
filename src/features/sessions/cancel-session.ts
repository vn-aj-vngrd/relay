"use server";

import { and, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { messages, notifications, sessionPlayers, sessions } from "@/db/schema";
import { can, sessionActor } from "@/features/auth/permissions";
import { requireUser } from "@/features/auth/session";
import { assertRateLimit } from "@/lib/rate-limit";

export type CancelSessionState = { error?: string; success?: string };

const cancellationCategories = [
  "court_unavailable",
  "weather",
  "not_enough_players",
  "schedule_conflict",
  "host_unavailable",
  "other",
] as const;

const inputSchema = z.object({
  sessionId: z.uuid(),
  version: z.coerce.number().int().positive(),
  category: z.enum(cancellationCategories),
  reason: z.string().trim().max(240),
});

export async function cancelSessionAction(
  _: CancelSessionState,
  formData: FormData
): Promise<CancelSessionState> {
  const user = await requireUser();
  await assertRateLimit(
    { scope: "session-cancel", limit: 5, windowSeconds: 3600 },
    `user:${user.id}`,
    "Game cancellations are temporarily limited. Wait before trying again."
  );
  const parsed = inputSchema.safeParse({
    sessionId: formData.get("sessionId"),
    version: formData.get("version"),
    category: formData.get("category"),
    reason: formData.get("reason"),
  });
  if (!parsed.success)
    return {
      error: "Choose a reason and keep the explanation under 240 characters.",
    };
  if (parsed.data.category === "other" && parsed.data.reason.length < 2)
    return { error: "Add a brief explanation when choosing Other." };

  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, parsed.data.sessionId),
  });
  if (!session) return { error: "This game no longer exists." };
  const membership = await db.query.sessionPlayers.findFirst({
    where: and(
      eq(sessionPlayers.sessionId, session.id),
      eq(sessionPlayers.userId, user.id)
    ),
  });
  if (
    !can(
      sessionActor({
        userId: user.id,
        hostId: session.hostId,
        membership,
      }),
      "edit"
    )
  )
    return { error: "Only the host or a co-host can cancel this game." };
  if (session.status === "draft")
    return { error: "Draft games can be deleted instead of cancelled." };
  if (session.status !== "published")
    return { error: "Only a game that has not started can be cancelled here." };

  const reason = parsed.data.reason || categoryLabel(parsed.data.category);
  try {
    await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${session.id} for update`
      );
      const [updated] = await tx
        .update(sessions)
        .set({
          status: "cancelled",
          cancelledAt: new Date(),
          cancelledById: user.id,
          cancellationCategory: parsed.data.category,
          cancellationReason: reason,
          version: sql`${sessions.version} + 1`,
          updatedAt: new Date(),
        })
        .where(
          and(
            eq(sessions.id, session.id),
            eq(sessions.status, "published"),
            eq(sessions.version, parsed.data.version)
          )
        )
        .returning({ id: sessions.id });
      if (!updated) throw new Error("SESSION_CONFLICT");
      const recipients = await tx
        .select({ userId: sessionPlayers.userId })
        .from(sessionPlayers)
        .where(eq(sessionPlayers.sessionId, session.id));
      const recipientIds = [
        ...new Set(
          recipients.flatMap(({ userId }) =>
            userId && userId !== user.id ? [userId] : []
          )
        ),
      ];
      if (recipientIds.length)
        await tx.insert(notifications).values(
          recipientIds.map((userId) => ({
            userId,
            sessionId: session.id,
            type: "session_cancelled",
            payload: { reason, cancelledByCohost: user.id !== session.hostId },
            dedupeKey: `session-cancelled:${session.id}:${userId}`,
          }))
        );
      await tx.insert(messages).values({
        sessionId: session.id,
        kind: "system",
        body: `Game cancelled · ${reason}`,
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message === "SESSION_CONFLICT")
      return {
        error:
          "This game changed on another device. Refresh before cancelling it.",
      };
    console.error(
      "Session cancellation failed",
      error instanceof Error ? error.name : "UnknownError"
    );
    return { error: "The game couldn’t be cancelled. Refresh and try again." };
  }

  revalidatePath("/home");
  revalidatePath("/games");
  revalidatePath(`/games/${session.id}`);
  revalidatePath(`/s/${session.slug}`);
  return { success: "Game cancelled. Players can now review the reason." };
}

function categoryLabel(category: (typeof cancellationCategories)[number]) {
  switch (category) {
    case "court_unavailable":
      return "Court or venue unavailable";
    case "weather":
      return "Weather";
    case "not_enough_players":
      return "Not enough players";
    case "schedule_conflict":
      return "Schedule conflict";
    case "host_unavailable":
      return "Host unavailable";
    default:
      return "Other";
  }
}
