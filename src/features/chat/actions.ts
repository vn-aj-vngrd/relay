"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db } from "@/db/client";
import { messageReactions, messages } from "@/db/schema";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";
import { getServerEnv } from "@/lib/env";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { validateChatImageFile } from "./config";

export type ChatActionState = { error?: string; success?: boolean };

export async function sendMessage(_: ChatActionState, formData: FormData): Promise<ChatActionState> {
  const sessionId = z.uuid().safeParse(formData.get("sessionId"));
  if (!sessionId.success) return { error: "This chat could not be found." };
  const bodyValue = formData.get("body");
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;
  if (!body && !hasImage) return { error: "Write a message or attach a photo." };
  if (body.length > 1000) return { error: "Keep messages under 1,000 characters." };
  const imageValidation = hasImage ? await validateChatImageFile(image, getServerEnv().CHAT_IMAGE_MAX_BYTES) : null;
  if (imageValidation && "error" in imageValidation) return { error: imageValidation.error };

  const viewer = await getSessionViewer(sessionId.data, String(formData.get("slug") ?? ""));
  if (!viewer || !canParticipate(viewer.player.rsvp)) return { error: "Join this session before sending messages." };

  const [message] = await db.insert(messages).values({ sessionId: sessionId.data, authorId: viewer.user?.id ?? null, sessionPlayerId: viewer.player.id, body: body || null, kind: hasImage ? "image" : "text" }).returning();
  if (hasImage && imageValidation && "file" in imageValidation) {
    const path = `${sessionId.data}/${message.id}/${crypto.randomUUID()}.${imageValidation.extension}`;
    const supabase = createSupabaseAdminClient();
    const { error } = await supabase.storage.from("chat-images").upload(path, image, { contentType: image.type, upsert: false });
    if (error) {
      await db.delete(messages).where(eq(messages.id, message.id));
      return { error: "The photo could not be uploaded. Check your connection and try again." };
    }
    await db.update(messages).set({ imagePath: path, updatedAt: new Date() }).where(eq(messages.id, message.id));
  }
  revalidatePath(`/games/${sessionId.data}/chat`);
  const slug = formData.get("slug");
  if (typeof slug === "string" && slug) revalidatePath(`/s/${slug}/chat`);
  return { success: true };
}

export async function toggleMessageReaction(formData: FormData) {
  const messageId = z.uuid().parse(formData.get("messageId"));
  const message = await db.query.messages.findFirst({ where: eq(messages.id, messageId) });
  if (!message) return;
  const slug = String(formData.get("slug") ?? "");
  const viewer = await getSessionViewer(message.sessionId, slug);
  if (!viewer || !canParticipate(viewer.player.rsvp)) return;
  const existing = await db.query.messageReactions.findFirst({ where: and(eq(messageReactions.messageId, message.id), eq(messageReactions.sessionPlayerId, viewer.player.id), eq(messageReactions.reaction, "like")) });
  if (existing) await db.delete(messageReactions).where(eq(messageReactions.id, existing.id));
  else await db.insert(messageReactions).values({ messageId: message.id, sessionPlayerId: viewer.player.id, userId: viewer.user?.id ?? null, reaction: "like" });
  revalidatePath(`/games/${message.sessionId}/chat`);
  if (slug) revalidatePath(`/s/${slug}/chat`);
}
