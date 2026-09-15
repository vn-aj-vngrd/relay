"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { adminAuditLogs, billingSettings } from "@/db/schema";
import { imageUploadLimitsSchema } from "@/lib/upload-config";

import type { AdminActionState } from "./actions";
import { requireAdmin } from "./auth";

export async function updateImageUploadLimitsAction(
  _: AdminActionState,
  formData: FormData
): Promise<AdminActionState> {
  const actor = await requireAdmin();
  const parsed = imageUploadLimitsSchema.safeParse({
    chatImageMaxMiB: formData.get("chatImageMaxMiB"),
    memoryImageMaxMiB: formData.get("memoryImageMaxMiB"),
  });
  if (!parsed.success)
    return { error: "Enter a whole number from 1 to 4 MiB for each limit." };

  try {
    await db.transaction(async (tx) => {
      const saved = await tx
        .update(billingSettings)
        .set({ ...parsed.data, updatedAt: new Date() })
        .where(eq(billingSettings.id, "global"))
        .returning({ id: billingSettings.id });
      if (!saved.length) throw new Error("BILLING_SETTINGS_MISSING");
      await tx.insert(adminAuditLogs).values({
        actorUserId: actor.id,
        action: "uploads.image_limits_updated",
        targetType: "billing_settings",
        targetId: "global",
        metadata: parsed.data,
      });
    });
  } catch (error) {
    console.error("Image upload limits update failed", error);
    return { error: "The photo limits could not be saved. Try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/pricing");
  revalidatePath("/games/[id]/chat", "page");
  revalidatePath("/s/[slug]/chat", "page");
  revalidatePath("/games/[id]/story", "page");
  revalidatePath("/s/[slug]/story", "page");
  return {
    success: `Photo limits saved: chat ${parsed.data.chatImageMaxMiB} MiB, album ${parsed.data.memoryImageMaxMiB} MiB.`,
  };
}
