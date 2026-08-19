"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db/client";
import { adminAuditLogs, feedbackSubmissions } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

import { submitFeedbackSchema, updateFeedbackSchema } from "./validation";

export type FeedbackActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

export async function submitFeedbackAction(_: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const user = await requireUser("/feedback");
  const limit = await checkRateLimit({ scope: "feedback-submit", limit: 5, windowSeconds: 3600 }, `user:${user.id}`);
  if (!limit.allowed) return { error: "You’ve sent several submissions recently. Try again later." };
  const parsed = submitFeedbackSchema.safeParse({
    type: formData.get("type"),
    area: formData.get("area"),
    title: formData.get("title"),
    description: formData.get("description"),
    pagePath: formData.get("pagePath") ?? "",
    contactAllowed: formData.get("contactAllowed") === "on",
  });
  if (!parsed.success) {
    return {
      error: "Check the fields marked below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  await db.insert(feedbackSubmissions).values({
    userId: user.id,
    type: parsed.data.type,
    area: parsed.data.area,
    title: parsed.data.title,
    description: parsed.data.description,
    pagePath: parsed.data.pagePath ?? null,
    contactAllowed: parsed.data.contactAllowed,
  });

  revalidatePath("/feedback");
  revalidatePath("/admin/feedback");
  return { success: "Thanks—your feedback is in the Relay inbox." };
}

export async function updateFeedbackAction(_: FeedbackActionState, formData: FormData): Promise<FeedbackActionState> {
  const admin = await requireAdmin();
  const parsed = updateFeedbackSchema.safeParse({
    feedbackId: formData.get("feedbackId"),
    status: formData.get("status"),
    adminNote: formData.get("adminNote"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Check the review details." };
  }

  const current = await db.query.feedbackSubmissions.findFirst({
    where: eq(feedbackSubmissions.id, parsed.data.feedbackId),
  });
  if (!current) return { error: "This feedback submission no longer exists." };

  const now = new Date();
  await db.transaction(async (tx) => {
    await tx
      .update(feedbackSubmissions)
      .set({
        status: parsed.data.status,
        adminNote: parsed.data.adminNote || null,
        reviewedById: admin.id,
        reviewedAt: now,
        resolvedAt: parsed.data.status === "resolved" ? (current.resolvedAt ?? now) : null,
        updatedAt: now,
      })
      .where(eq(feedbackSubmissions.id, current.id));
    await tx.insert(adminAuditLogs).values({
      actorUserId: admin.id,
      action: "feedback.reviewed",
      targetType: "feedback",
      targetId: current.id,
      metadata: { previousStatus: current.status, nextStatus: parsed.data.status },
    });
  });

  revalidatePath("/admin");
  revalidatePath("/admin/feedback");
  revalidatePath(`/admin/feedback/${current.id}`);
  revalidatePath("/feedback");
  return { success: "Review saved." };
}
