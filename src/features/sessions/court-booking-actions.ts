"use server";

import { and, eq, isNull, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { messages, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { assertRateLimit } from "@/lib/rate-limit";

const inputSchema = z.object({
  sessionId: z.uuid(),
  version: z.coerce.number().int().positive(),
  booking: z.enum(["confirmed", "not_required"]),
});

export type CourtBookingState = { error?: string; success?: boolean };

export async function confirmCourtBooking(
  _: CourtBookingState,
  formData: FormData
): Promise<CourtBookingState> {
  const user = await requireUser();
  await assertRateLimit(
    { scope: "session-update", limit: 30, windowSeconds: 60 },
    `user:${user.id}`,
    "Booking changes are happening too quickly. Wait and try again."
  );
  const parsed = inputSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { error: "Choose a court arrangement." };
  const input = parsed.data;
  try {
    const result = await db.transaction(async (tx) => {
      await tx.execute(
        sql`select id from ${sessions} where id = ${input.sessionId} for update`
      );
      const session = await tx.query.sessions.findFirst({
        where: eq(sessions.id, input.sessionId),
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
        return { error: "Only a host or co-host can confirm the court." };
      if (
        (session.status !== "draft" && session.status !== "published") ||
        session.version !== input.version
      )
        return {
          error: "The game changed. Review the current booking and try again.",
        };
      await tx
        .update(sessions)
        .set({
          bookedAt:
            input.booking === "confirmed"
              ? (session.bookedAt ?? new Date())
              : null,
          bookingNotRequired: input.booking === "not_required",
          version: session.version + 1,
          updatedAt: new Date(),
        })
        .where(eq(sessions.id, session.id));
      await tx.insert(messages).values({
        sessionId: session.id,
        kind: "system",
        body:
          input.booking === "confirmed"
            ? "Court booking confirmed."
            : "No court booking is needed for this game.",
      });
      return { slug: session.slug };
    });
    revalidatePath(`/games/${input.sessionId}/play/setup`);
    if ("error" in result) return { error: result.error };
    revalidatePath("/home");
    revalidatePath("/games");
    revalidatePath(`/games/${input.sessionId}`, "layout");
    revalidatePath(`/s/${result.slug}`, "layout");
    return { success: true };
  } catch {
    return { error: "The court arrangement couldn’t be saved. Try again." };
  }
}
