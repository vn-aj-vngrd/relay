"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { comments, memories, memoryMedia, reactions, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireCompletedParticipant(sessionId: string) {
  const user = await requireUser();
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  const player = await db.query.sessionPlayers.findFirst({ where: and(eq(sessionPlayers.sessionId, sessionId), eq(sessionPlayers.userId, user.id), eq(sessionPlayers.rsvp, "going")) });
  if (!session || session.status !== "completed" || (!player && session.hostId !== user.id)) throw new Error("Only players can add to this memory");
  let memory = await db.query.memories.findFirst({ where: eq(memories.sessionId, sessionId) });
  if (!memory) [memory] = await db.insert(memories).values({ sessionId }).returning();
  return { user, session, memory };
}

export async function uploadMemoryPhoto(formData: FormData) {
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const { user, session, memory } = await requireCompletedParticipant(sessionId);
  const file = formData.get("photo");
  if (!(file instanceof File) || !["image/jpeg", "image/png", "image/webp"].includes(file.type) || file.size > 10 * 1024 * 1024) throw new Error("Choose a JPG, PNG, or WebP image under 10 MB");
  const caption = z.string().trim().max(240).parse(formData.get("caption") ?? "");
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${sessionId}/${user.id}/${crypto.randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage.from("session-memories").upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("The photo could not be uploaded");
  await db.insert(memoryMedia).values({ memoryId: memory.id, uploaderId: user.id, storagePath: path, mediaType: "image", caption: caption || null, altText: caption || `Photo from ${session.title}` });
  revalidatePath(`/s/${session.slug}`);
}

export async function addMemoryComment(formData: FormData) {
  const sessionId = z.uuid().parse(formData.get("sessionId")); const { user, session, memory } = await requireCompletedParticipant(sessionId);
  const body = z.string().trim().min(1).max(500).parse(formData.get("body"));
  await db.insert(comments).values({ memoryId: memory.id, authorId: user.id, body });
  revalidatePath(`/s/${session.slug}`);
}

export async function toggleMemoryReaction(formData: FormData) {
  const sessionId = z.uuid().parse(formData.get("sessionId")); const { user, session, memory } = await requireCompletedParticipant(sessionId);
  const existing = await db.query.reactions.findFirst({ where: and(eq(reactions.memoryId, memory.id), eq(reactions.userId, user.id), eq(reactions.reaction, "love")) });
  if (existing) await db.delete(reactions).where(and(eq(reactions.memoryId, memory.id), eq(reactions.userId, user.id), eq(reactions.reaction, "love")));
  else await db.insert(reactions).values({ memoryId: memory.id, userId: user.id, reaction: "love" });
  revalidatePath(`/s/${session.slug}`);
}
