"use server";
import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { memories, memoryMedia, sessionPlayers, sessions } from "@/db/schema";
import { requireUser } from "@/features/auth/session";
import { hasValidImageSignature, isSupportedImageType } from "@/lib/image-file";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

async function requireCompletedParticipant(sessionId: string) {
  const user = await requireUser();
  const session = await db.query.sessions.findFirst({ where: eq(sessions.id, sessionId) });
  const player = await db.query.sessionPlayers.findFirst({
    where: and(
      eq(sessionPlayers.sessionId, sessionId),
      eq(sessionPlayers.userId, user.id),
      eq(sessionPlayers.rsvp, "going"),
    ),
  });
  if (!session || session.status !== "completed" || (!player && session.hostId !== user.id))
    throw new Error("Only players can add to this memory");
  let memory = await db.query.memories.findFirst({ where: eq(memories.sessionId, sessionId) });
  if (!memory) [memory] = await db.insert(memories).values({ sessionId }).returning();
  return { user, session, memory };
}

export async function uploadMemoryPhoto(formData: FormData) {
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const { user, session, memory } = await requireCompletedParticipant(sessionId);
  const file = formData.get("photo");
  if (!(file instanceof File) || !isSupportedImageType(file.type) || file.size === 0 || file.size > 10 * 1024 * 1024)
    throw new Error("Choose a JPG, PNG, or WebP image under 10 MB");
  if (!(await hasValidImageSignature(file))) throw new Error("That file doesn’t appear to be a valid image.");
  const limit = await checkRateLimit({ scope: "memory-photo", limit: 20, windowSeconds: 86400 }, `user:${user.id}`);
  if (!limit.allowed) throw new Error("Photo uploads are temporarily limited. Try again tomorrow.");
  const caption = z
    .string()
    .trim()
    .max(240)
    .parse(formData.get("caption") ?? "");
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${sessionId}/${user.id}/${crypto.randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from("session-memories")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("The photo could not be uploaded");
  try {
    await db.insert(memoryMedia).values({
      memoryId: memory.id,
      uploaderId: user.id,
      storagePath: path,
      mediaType: "image",
      caption: caption || null,
      altText: caption || `Photo from ${session.title}`,
    });
  } catch (uploadRecordError) {
    await supabase.storage.from("session-memories").remove([path]);
    console.error("Memory photo record failed", uploadRecordError);
    throw new Error("The photo could not be saved. Try again.");
  }
  revalidatePath(`/games/${session.id}/story`);
  revalidatePath(`/s/${session.slug}/story`);
  revalidatePath(`/s/${session.slug}`);
}
