"use server";
import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { unstable_rethrow } from "next/navigation";
import { z } from "zod";

import { db } from "@/db/client";
import { memories, memoryMedia, sessions } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";
import { getSessionViewer } from "@/features/sessions/viewer";
import { hasValidImageSignature, isSupportedImageType } from "@/lib/image-file";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";

import { canContributeMemory } from "./permissions";

async function requireCompletedParticipant(sessionId: string) {
  const session = await db.query.sessions.findFirst({
    where: eq(sessions.id, sessionId),
  });
  if (session?.status !== "completed")
    throw new Error("Photos can be added after the game ends.");

  const viewer = await getSessionViewer(session.id, session.slug);
  const user = viewer?.user ?? (await getCurrentUser());
  const player = viewer?.player;
  if (
    !canContributeMemory(session, {
      userId: user?.id,
      player,
    })
  )
    throw new Error("Only players and organizers can add game photos.");

  let memory = await db.query.memories.findFirst({
    where: eq(memories.sessionId, sessionId),
  });
  if (!memory) {
    [memory] = await db
      .insert(memories)
      .values({ sessionId })
      .onConflictDoNothing({ target: memories.sessionId })
      .returning();
    memory ??= await db.query.memories.findFirst({
      where: eq(memories.sessionId, sessionId),
    });
  }
  if (!memory) throw new Error("The game memory could not be prepared.");

  return {
    actorKey: user ? `user:${user.id}` : `guest:${player?.id}`,
    uploaderId: user?.id ?? null,
    session,
    memory,
  };
}

export type MemoryPhotoActionState = { error?: string; success?: boolean };

export async function uploadMemoryPhotoState(
  _: MemoryPhotoActionState,
  formData: FormData
): Promise<MemoryPhotoActionState> {
  const photo = formData.get("photo");
  if (!(photo instanceof File) || photo.size === 0)
    return { error: "Choose a game photo before adding it to the memory." };
  try {
    await uploadMemoryPhoto(formData);
    return { success: true };
  } catch (error) {
    unstable_rethrow(error);
    return {
      error:
        error instanceof Error &&
        !(error instanceof z.ZodError) &&
        error.message
          ? error.message
          : "The photo could not be saved. Try again.",
    };
  }
}

async function uploadMemoryPhoto(formData: FormData) {
  const sessionId = z.uuid().parse(formData.get("sessionId"));
  const { actorKey, uploaderId, session, memory } =
    await requireCompletedParticipant(sessionId);
  const file = formData.get("photo");
  if (
    !(file instanceof File) ||
    !isSupportedImageType(file.type) ||
    file.size === 0 ||
    file.size > 10 * 1024 * 1024
  )
    throw new Error("Choose a JPG, PNG, or WebP image under 10 MB");
  if (!(await hasValidImageSignature(file)))
    throw new Error("That file doesn’t appear to be a valid image.");
  const limit = await checkRateLimit(
    { scope: "memory-photo", limit: 20, windowSeconds: 86400 },
    actorKey
  );
  if (!limit.allowed)
    throw new Error(
      "Photo uploads are temporarily limited. Try again tomorrow."
    );
  const caption = z
    .string()
    .trim()
    .max(240)
    .parse(formData.get("caption") ?? "");
  const extension = file.type.split("/")[1].replace("jpeg", "jpg");
  const path = `${sessionId}/${actorKey.replace(":", "-")}/${crypto.randomUUID()}.${extension}`;
  const supabase = createSupabaseAdminClient();
  const { error } = await supabase.storage
    .from("session-memories")
    .upload(path, file, { contentType: file.type, upsert: false });
  if (error) throw new Error("The photo could not be uploaded");
  try {
    await db.insert(memoryMedia).values({
      memoryId: memory.id,
      uploaderId,
      storagePath: path,
      mediaType: "image",
      caption: caption || null,
      altText: caption || `Photo from ${session.title}`,
    });
  } catch (uploadRecordError) {
    await supabase.storage.from("session-memories").remove([path]);
    console.error("Memory photo record failed", uploadRecordError);
    throw new Error("The photo could not be saved. Try again.", {
      cause: uploadRecordError,
    });
  }
  revalidatePath(`/games/${session.id}/story`);
  revalidatePath(`/s/${session.slug}/story`);
  revalidatePath(`/s/${session.slug}`);
}
