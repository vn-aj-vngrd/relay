import "server-only";

import { and, count, desc, eq, ilike, inArray, lt, or, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { feedbackSubmissions, productEvents, profiles, users } from "@/db/schema";
import { type AdminCursor, encodeAdminCursor } from "@/features/admin/cursor";
import { ADMIN_PAGE_SIZE, type AdminFeedbackRecord, type AdminPage } from "@/features/admin/records";

import { type FeedbackStatus, feedbackStatuses, type FeedbackType, feedbackTypes } from "./domain";

export async function shouldShowPostGameFeedback(userId: string, sessionId: string) {
  const [feedback, dismissal] = await Promise.all([
    db.query.feedbackSubmissions.findFirst({
      columns: { id: true },
      where: and(eq(feedbackSubmissions.userId, userId), eq(feedbackSubmissions.sessionId, sessionId)),
    }),
    db.query.productEvents.findFirst({
      columns: { id: true },
      where: and(
        eq(productEvents.userId, userId),
        eq(productEvents.sessionId, sessionId),
        inArray(productEvents.name, ["post_game_feedback_smooth", "post_game_feedback_dismissed"]),
      ),
    }),
  ]);
  return !feedback && !dismissal;
}

export async function getOwnFeedback(userId: string) {
  return db
    .select({
      id: feedbackSubmissions.id,
      type: feedbackSubmissions.type,
      area: feedbackSubmissions.area,
      status: feedbackSubmissions.status,
      title: feedbackSubmissions.title,
      createdAt: feedbackSubmissions.createdAt,
      updatedAt: feedbackSubmissions.updatedAt,
    })
    .from(feedbackSubmissions)
    .where(eq(feedbackSubmissions.userId, userId))
    .orderBy(desc(feedbackSubmissions.createdAt))
    .limit(10);
}

export async function getAdminFeedback(input: {
  query?: string;
  type?: string;
  status?: string;
  cursor?: AdminCursor | null;
}) {
  const conditions: SQL[] = [];
  const query = input.query?.trim();
  if (query) {
    const pattern = `%${query}%`;
    const search = or(
      ilike(feedbackSubmissions.title, pattern),
      ilike(feedbackSubmissions.description, pattern),
      ilike(users.email, pattern),
      ilike(profiles.name, pattern),
    );
    if (search) conditions.push(search);
  }
  if (feedbackTypes.includes(input.type as FeedbackType)) {
    conditions.push(eq(feedbackSubmissions.type, input.type as FeedbackType));
  }
  if (feedbackStatuses.includes(input.status as FeedbackStatus)) {
    conditions.push(eq(feedbackSubmissions.status, input.status as FeedbackStatus));
  }
  if (input.cursor) {
    const cursorCondition = or(
      lt(feedbackSubmissions.createdAt, input.cursor.at),
      and(eq(feedbackSubmissions.createdAt, input.cursor.at), lt(feedbackSubmissions.id, input.cursor.id)),
    );
    if (cursorCondition) conditions.push(cursorCondition);
  }

  const [rows, statusCounts] = await Promise.all([
    db
      .select({
        id: feedbackSubmissions.id,
        type: feedbackSubmissions.type,
        area: feedbackSubmissions.area,
        status: feedbackSubmissions.status,
        title: feedbackSubmissions.title,
        createdAt: feedbackSubmissions.createdAt,
        submitterEmail: users.email,
        submitterName: profiles.name,
      })
      .from(feedbackSubmissions)
      .innerJoin(users, eq(users.id, feedbackSubmissions.userId))
      .leftJoin(profiles, eq(profiles.userId, users.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(feedbackSubmissions.createdAt), desc(feedbackSubmissions.id))
      .limit(ADMIN_PAGE_SIZE + 1),
    db
      .select({ status: feedbackSubmissions.status, total: count() })
      .from(feedbackSubmissions)
      .groupBy(feedbackSubmissions.status),
  ]);

  const items: AdminFeedbackRecord[] = rows.slice(0, ADMIN_PAGE_SIZE);
  const last = items.at(-1);
  const page: AdminPage<AdminFeedbackRecord> = {
    items,
    nextCursor:
      rows.length > ADMIN_PAGE_SIZE && last ? encodeAdminCursor({ at: new Date(last.createdAt), id: last.id }) : null,
  };
  return { ...page, statusCounts: Object.fromEntries(statusCounts.map(({ status, total }) => [status, total])) };
}

export async function getAdminFeedbackDetail(feedbackId: string) {
  const rows = await db
    .select({
      feedback: feedbackSubmissions,
      submitterEmail: users.email,
      submitterName: profiles.name,
      submitterUsername: profiles.username,
    })
    .from(feedbackSubmissions)
    .innerJoin(users, eq(users.id, feedbackSubmissions.userId))
    .leftJoin(profiles, eq(profiles.userId, users.id))
    .where(eq(feedbackSubmissions.id, feedbackId))
    .limit(1);
  return rows[0] ?? null;
}
