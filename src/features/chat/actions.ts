"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { messageReactions, messages, sessions } from "@/db/schema";
import { BillingError, mediaPolicy } from "@/features/billing/domain";
import { storeGameMedia } from "@/features/billing/media";
import { canParticipate, getSessionViewer } from "@/features/sessions/viewer";
import { assertRateLimit, checkRateLimit } from "@/lib/rate-limit";

import { validateChatImageFile } from "./config";

export type ChatActionState = { error?: string; success?: boolean };

export async function sendMessage(
  _: ChatActionState,
  formData: FormData
): Promise<ChatActionState> {
  const sessionId = z.uuid().safeParse(formData.get("sessionId"));
  if (!sessionId.success) return { error: "This chat could not be found." };
  const bodyValue = formData.get("body");
  const body = typeof bodyValue === "string" ? bodyValue.trim() : "";
  const image = formData.get("image");
  const hasImage = image instanceof File && image.size > 0;
  if (!body && !hasImage)
    return { error: "Write a message or attach a photo." };
  if (body.length > 1000)
    return { error: "Keep messages under 1,000 characters." };
  const imageValidation = hasImage
    ? await validateChatImageFile(image, mediaPolicy.chat.maxBytes)
    : null;
  if (imageValidation && "error" in imageValidation)
    return { error: imageValidation.error };

  const viewer = await getSessionViewer(
    sessionId.data,
    String(formData.get("slug") ?? "")
  );
  if (!viewer || !canParticipate(viewer.player.rsvp))
    return { error: "Join this session before sending messages." };
  const session = await db.query.sessions.findFirst({
    columns: { status: true, hostId: true, participantImagesEnabled: true },
    where: eq(sessions.id, sessionId.data),
  });
  if (session?.status === "cancelled")
    return { error: "Chat is read-only because this game was cancelled." };
  const limit = await checkRateLimit(
    { scope: "session-chat", limit: 30, windowSeconds: 60 },
    `player:${viewer.player.id}`
  );
  if (!limit.allowed)
    return {
      error: "Messages are sending too quickly. Wait a moment and try again.",
    };
  if (!session) return { error: "This game could not be found." };
  const message = {
    id: crypto.randomUUID(),
    sessionId: sessionId.data,
    authorId: viewer.user?.id ?? null,
    sessionPlayerId: viewer.player.id,
    body: body || null,
    kind: hasImage ? ("image" as const) : ("text" as const),
  };
  if (hasImage && imageValidation && "file" in imageValidation) {
    if (!session.participantImagesEnabled && viewer.user?.id !== session.hostId)
      return {
        error:
          "The host has turned off participant image uploads. You can still send text.",
      };
    const path = `${sessionId.data}/${message.id}/${crypto.randomUUID()}.${imageValidation.extension}`;
    try {
      await storeGameMedia(
        {
          hostId: session.hostId,
          sessionId: sessionId.data,
          actorKey: viewer.user
            ? `user:${viewer.user.id}`
            : `guest:${viewer.player.id}`,
          kind: "chat",
          path,
          file: image,
        },
        async (tx) => {
          await tx.insert(messages).values({ ...message, imagePath: path });
        }
      );
    } catch (error) {
      return {
        error:
          error instanceof BillingError
            ? error.message
            : "The photo could not be saved. Please try again.",
      };
    }
  } else {
    await db.insert(messages).values(message);
  }
  revalidatePath(`/games/${sessionId.data}/chat`);
  const slug = formData.get("slug");
  if (typeof slug === "string" && slug) revalidatePath(`/s/${slug}/chat`);
  return { success: true };
}

export async function toggleMessageReaction(formData: FormData) {
  const messageId = z.uuid().parse(formData.get("messageId"));
  const message = await db.query.messages.findFirst({
    where: eq(messages.id, messageId),
  });
  if (!message) return;
  const slug = String(formData.get("slug") ?? "");
  const viewer = await getSessionViewer(message.sessionId, slug);
  if (!viewer || !canParticipate(viewer.player.rsvp)) return;
  const session = await db.query.sessions.findFirst({
    columns: { status: true },
    where: eq(sessions.id, message.sessionId),
  });
  if (session?.status === "cancelled") return;
  await assertRateLimit(
    { scope: "chat-reaction", limit: 60, windowSeconds: 60 },
    `player:${viewer.player.id}`,
    "Reactions are changing too quickly. Wait a moment and try again."
  );
  const existing = await db.query.messageReactions.findFirst({
    where: and(
      eq(messageReactions.messageId, message.id),
      eq(messageReactions.sessionPlayerId, viewer.player.id),
      eq(messageReactions.reaction, "like")
    ),
  });
  await db.transaction(async (tx) => {
    if (existing)
      await tx
        .delete(messageReactions)
        .where(eq(messageReactions.id, existing.id));
    else
      await tx.insert(messageReactions).values({
        messageId: message.id,
        sessionPlayerId: viewer.player.id,
        userId: viewer.user?.id ?? null,
        reaction: "like",
      });
    // Reactions do not carry session_id, so touching the parent emits a valid
    // session-scoped realtime event without subscribing to every reaction.
    await tx
      .update(messages)
      .set({ updatedAt: new Date() })
      .where(eq(messages.id, message.id));
  });
  revalidatePath(`/games/${message.sessionId}/chat`);
  if (slug) revalidatePath(`/s/${slug}/chat`);
}
