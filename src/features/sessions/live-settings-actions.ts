"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { messages, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { assertRateLimit } from "@/lib/rate-limit";

import type { SessionActionState } from "./actions";
import { updateLiveSessionSchema } from "./domain";

export async function updateLiveSessionAction(
  _: SessionActionState,
  formData: FormData
): Promise<SessionActionState> {
  const user = await requireUser();
  await assertRateLimit(
    { scope: "session-update", limit: 30, windowSeconds: 60 },
    `user:${user.id}`,
    "Game changes are happening too quickly. Wait a moment and try again."
  );
  const bookingNotRequired = formData.get("bookingNotRequired") === "on";
  const booked = !bookingNotRequired && formData.get("booked") === "on";
  const total = formData.get("bookingTotal");
  const parsed = updateLiveSessionSchema.safeParse({
    section: formData.get("section"),
    sessionId: formData.get("sessionId"),
    version: formData.get("version"),
    notes: formData.get("notes") || undefined,
    booked,
    bookingNotRequired,
    bookingReference: booked
      ? formData.get("bookingReference") || undefined
      : undefined,
    bookingTotalCents:
      booked && typeof total === "string" && total
        ? Math.round(Number(total) * 100)
        : undefined,
    bookingNotes: booked
      ? formData.get("bookingNotes") || undefined
      : undefined,
  });
  if (!parsed.success)
    return {
      error:
        parsed.error.issues[0]?.message ?? "Check the details and try again.",
    };

  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${parsed.data.sessionId} for update`
      );
      const session = await tx.query.sessions.findFirst({
        where: eq(sessions.id, parsed.data.sessionId),
      });
      if (!session) return { error: "This game no longer exists." };
      const membership = await tx.query.sessionPlayers.findFirst({
        where: and(
          eq(sessionPlayers.sessionId, session.id),
          eq(sessionPlayers.userId, user.id),
          isNull(sessionPlayers.leftAt)
        ),
      });
      if (session.hostId !== user.id && membership?.role !== "cohost")
        return { error: "Only the host or co-host can change game settings." };
      if (session.status !== "live")
        return {
          error:
            "These changes are only available during Play. Refresh to view current settings.",
        };
      if (session.version !== parsed.data.version)
        return {
          error: "The game changed on another device. Refresh and try again.",
        };

      const details = parsed.data;
      await tx
        .update(sessions)
        .set({
          ...(details.section === "invite"
            ? { notes: details.notes ?? null }
            : {
                bookingNotRequired: details.bookingNotRequired,
                bookedAt: details.booked
                  ? (session.bookedAt ?? new Date())
                  : null,
                bookingReference: details.booked
                  ? (details.bookingReference ?? null)
                  : null,
                bookingTotalCents: details.booked
                  ? (details.bookingTotalCents ?? null)
                  : null,
                bookingNotes: details.booked
                  ? (details.bookingNotes ?? null)
                  : null,
              }),
          version: session.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, session.id));
      await tx.insert(messages).values({
        sessionId: session.id,
        kind: "system",
        body:
          details.section === "invite"
            ? "The player note was updated."
            : "Booking details were updated.",
      });
      return { sessionId: session.id, slug: session.slug };
    });
    if ("error" in result) return { error: result.error };
    revalidatePath("/home");
    revalidatePath("/games");
    revalidatePath(`/games/${result.sessionId}`, "layout");
    revalidatePath(`/s/${result.slug}`, "layout");
    return { success: true };
  } catch {
    return { error: "The details couldn’t be saved. Try again." };
  }
}
