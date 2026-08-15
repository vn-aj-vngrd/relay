"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { messages, sessionPlayers } from "@/db/schema";
import { requireUser } from "@/features/auth/session";

export async function sendMessage(formData: FormData) {
  const user = await requireUser();
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const body = z.string().trim().min(1).max(1000).parse(formData.get("body"));
  const player = await db.query.sessionPlayers.findFirst({ where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, user.id)) });
  if (!player || !["going", "maybe", "waitlisted"].includes(player.rsvp)) throw new Error("Only session participants can send messages");
  await db.insert(messages).values({ sessionId, authorId: user.id, sessionPlayerId: player.id, body });
  revalidatePath(`/games/${sessionId}/chat`);
}
