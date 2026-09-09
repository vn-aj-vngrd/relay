"use server";

import { and, eq, ne, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import {
  adminAuditLogs,
  billingMedia,
  memoryMedia,
  messages,
  sessions,
} from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { createSupabaseAdminClient } from "@/lib/supabase/admin";
import { BillingError, type BillingState } from "./domain";
import { reasonSchema } from "./validation";

export async function removeHostedPhoto(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const user = await requireUser();
  const id = z.uuid().safeParse(data.get("id"));
  if (!id.success || data.get("confirm") !== "on")
    return { error: "Confirm removal of this photo for everyone in the game." };
  const limit = await checkRateLimit(
    { scope: "billing-media-remove", limit: 30, windowSeconds: 60 },
    `user:${user.id}`
  );
  if (!limit.allowed)
    return {
      error: "Photo removals are happening too quickly. Try again in a minute.",
    };
  try {
    const session = await db.transaction(async (tx) => {
      const [media] = await tx
        .select()
        .from(billingMedia)
        .where(
          and(eq(billingMedia.id, id.data), eq(billingMedia.hostId, user.id))
        )
        .for("update");
      if (!media) throw new BillingError("Photo not found.");
      if (media.status === "released") return null;
      if (media.status !== "stored")
        throw new BillingError(
          "This upload is still being processed. Contact support if it remains pending."
        );
      const { error } = await createSupabaseAdminClient()
        .storage.from(media.bucket)
        .remove([media.path]);
      if (error)
        throw new BillingError(
          "The photo could not be deleted. Its storage allowance has not been released."
        );
      if (media.kind === "chat")
        await tx
          .update(messages)
          .set({
            imagePath: null,
            kind: "text",
            body: sql`coalesce(${messages.body}, 'Photo removed by host.')`,
            updatedAt: new Date(),
          })
          .where(eq(messages.imagePath, media.path));
      else
        await tx
          .delete(memoryMedia)
          .where(eq(memoryMedia.storagePath, media.path));
      await tx
        .update(billingMedia)
        .set({ status: "released" })
        .where(eq(billingMedia.id, media.id));
      return tx.query.sessions.findFirst({
        where: eq(sessions.id, media.sessionId),
        columns: { id: true, slug: true },
      });
    });
    revalidatePath("/settings/plan", "layout");
    if (session) {
      revalidatePath(`/games/${session.id}`, "layout");
      revalidatePath(`/s/${session.slug}`, "layout");
    }
    return {
      success:
        "Photo removed. Storage has been released; daily upload usage is unchanged.",
    };
  } catch (error) {
    return {
      error:
        error instanceof BillingError
          ? error.message
          : "The photo could not be removed. Try again.",
    };
  }
}

export async function cleanupStalledUpload(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const admin = await requireAdmin();
  const parsed = z
    .object({ id: z.uuid(), reason: reasonSchema })
    .safeParse(Object.fromEntries(data));
  if (!parsed.success || data.get("confirm") !== "on")
    return {
      error: "Give a reason and confirm cleanup of this incomplete upload.",
    };
  try {
    const hostId = await db.transaction(async (tx) => {
      const [media] = await tx
        .select()
        .from(billingMedia)
        .where(eq(billingMedia.id, parsed.data.id))
        .for("update");
      if (media?.status !== "reserved")
        throw new BillingError(
          "This upload is no longer awaiting cleanup. Refresh its status."
        );
      if (media.createdAt.getTime() > Date.now() - 3600_000)
        throw new BillingError(
          "Wait at least one hour before cleaning up an interrupted upload."
        );
      const { error } = await createSupabaseAdminClient()
        .storage.from(media.bucket)
        .remove([media.path]);
      if (error)
        throw new BillingError(
          "Storage deletion failed. The reservation remains counted; try again later."
        );
      await tx
        .update(billingMedia)
        .set({ status: "released" })
        .where(eq(billingMedia.id, media.id));
      await tx.insert(adminAuditLogs).values({
        actorUserId: admin.id,
        action: "billing.upload_cleaned",
        targetType: "billing_media",
        targetId: media.id,
        reason: parsed.data.reason,
        metadata: { hostId: media.hostId, bytesReleased: media.bytes },
      });
      return media.hostId;
    });
    revalidatePath(`/admin/users/${hostId}/billing`);
    revalidatePath("/settings/plan", "layout");
    return {
      success:
        "Incomplete upload cleaned up. Its reserved storage has been released.",
    };
  } catch (error) {
    return {
      error:
        error instanceof BillingError
          ? error.message
          : "Cleanup could not complete. The reservation remains available for a retry.",
    };
  }
}

export async function setParticipantImages(
  _: BillingState,
  data: FormData
): Promise<BillingState> {
  const user = await requireUser();
  const id = z.uuid().safeParse(data.get("sessionId"));
  if (!id.success) return { error: "Choose a valid game." };
  const limit = await checkRateLimit(
    { scope: "session-update", limit: 30, windowSeconds: 60 },
    `user:${user.id}`
  );
  if (!limit.allowed)
    return {
      error:
        "Game changes are happening too quickly. Wait a minute and try again.",
    };
  try {
    const rows = await db
      .update(sessions)
      .set({
        participantImagesEnabled: data.get("enabled") === "on",
        updatedAt: new Date(),
      })
      .where(
        and(
          eq(sessions.id, id.data),
          eq(sessions.hostId, user.id),
          ne(sessions.status, "cancelled")
        )
      )
      .returning({ slug: sessions.slug });
    if (!rows.length)
      return {
        error: "Only the host can change image uploads for an available game.",
      };
    revalidatePath("/settings/plan/media");
    revalidatePath(`/games/${id.data}`, "layout");
    revalidatePath(`/s/${rows[0].slug}`, "layout");
    return {
      success:
        "Participant image uploads updated. Host uploads and payment proof are unaffected.",
    };
  } catch {
    return {
      error: "Upload permissions could not be saved. Refresh and try again.",
    };
  }
}
