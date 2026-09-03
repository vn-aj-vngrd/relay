"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import { db } from "@/db/client";
import { adminAuditLogs, feedbackSubmissions, productEvents, sessionPlayers, sessions } from "@/db/schema";
import { requireAdmin } from "@/features/admin/auth";
import { requireUser } from "@/features/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";

import { submitFeedbackSchema, updateFeedbackSchema } from "./validation";

export type FeedbackActionState = {
  error?: string;
  success?: string;
  fieldErrors?: Record<string, string[]>;
};

async function canReviewCompletedSession(userId: string, sessionId: string) {
  const session = await db.query.sessions.findFirst({
    columns: { hostId: true, status: true },
    where: eq(sessions.id, sessionId),
  });
  if (!session || session.status !== "completed") return false;
  if (session.hostId === userId) return true;
  return Boolean(
    await db.query.sessionPlayers.findFirst({
      columns: { id: true },
      where: and(
        eq(sessionPlayers.sessionId, sessionId),
        eq(sessionPlayers.userId, userId),
        eq(sessionPlayers.rsvp, "going"),
      ),
    }),
  );
}

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
    sessionId: formData.get("sessionId") || undefined,
    experience: formData.get("experience") || undefined,
  });
  if (!parsed.success) {
    return {
      error: "Check the fields marked below.",
      fieldErrors: parsed.error.flatten().fieldErrors,
    };
  }

  if (parsed.data.sessionId && !(await canReviewCompletedSession(user.id, parsed.data.sessionId)))
    return { error: "This completed game is not available for feedback." };

  const inserted = await db
    .insert(feedbackSubmissions)
    .values({
      userId: user.id,
      sessionId: parsed.data.sessionId ?? null,
      experience: parsed.data.experience ?? null,
      type: parsed.data.type,
      area: parsed.data.area,
      title: parsed.data.title,
      description: parsed.data.description,
      pagePath: parsed.data.pagePath ?? null,
      contactAllowed: parsed.data.contactAllowed,
    })
    .onConflictDoNothing()
    .returning({ id: feedbackSubmissions.id });
  if (!inserted.length) return { success: "You already shared feedback for this game." };

  revalidatePath("/feedback");
  revalidatePath("/admin/feedback");
  if (parsed.data.sessionId) {
    revalidatePath(`/games/${parsed.data.sessionId}/play`);
    revalidatePath("/admin/insights");
  }
  return { success: "Thanks—your feedback is in the Relay inbox." };
}

export async function recordSmoothGameFeedback(
  _: FeedbackActionState,
  formData: FormData,
): Promise<FeedbackActionState> {
  const user = await requireUser("/games");
  const parsedSessionId = z.uuid().safeParse(formData.get("sessionId"));
  if (!parsedSessionId.success) return { error: "This completed game is unavailable." };
  const sessionId = parsedSessionId.data;
  if (!(await canReviewCompletedSession(user.id, sessionId))) return { error: "This completed game is unavailable." };
  await db
    .insert(productEvents)
    .values({
      name: "post_game_feedback_smooth",
      userId: user.id,
      sessionId,
      source: "server",
      metadata: {},
      dedupeKey: `session:${sessionId}:post-game-feedback:${user.id}`,
    })
    .onConflictDoNothing({ target: productEvents.dedupeKey });
  revalidatePath(`/games/${sessionId}/play`);
  revalidatePath("/admin/insights");
  return { success: "Thanks—glad the game ran smoothly." };
}

export async function dismissPostGameFeedback(formData: FormData) {
  const user = await requireUser("/games");
  const parsedSessionId = z.uuid().safeParse(formData.get("sessionId"));
  if (!parsedSessionId.success) return;
  const sessionId = parsedSessionId.data;
  if (!(await canReviewCompletedSession(user.id, sessionId))) return;
  await db
    .insert(productEvents)
    .values({
      name: "post_game_feedback_dismissed",
      userId: user.id,
      sessionId,
      source: "server",
      metadata: {},
      dedupeKey: `session:${sessionId}:post-game-feedback:${user.id}`,
    })
    .onConflictDoNothing({ target: productEvents.dedupeKey });
  revalidatePath(`/games/${sessionId}/play`);
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
