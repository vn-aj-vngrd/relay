import "server-only";

import { and, count, desc, eq, ilike, or, type SQL } from "drizzle-orm";

import { db } from "@/db/client";
import { feedbackSubmissions, profiles, users } from "@/db/schema";

import { type FeedbackStatus, feedbackStatuses, type FeedbackType, feedbackTypes } from "./domain";

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

export async function getAdminFeedback(input: { query?: string; type?: string; status?: string }) {
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

  const [items, statusCounts] = await Promise.all([
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
      .orderBy(desc(feedbackSubmissions.createdAt))
      .limit(100),
    db
      .select({ status: feedbackSubmissions.status, total: count() })
      .from(feedbackSubmissions)
      .groupBy(feedbackSubmissions.status),
  ]);

  return { items, statusCounts: Object.fromEntries(statusCounts.map(({ status, total }) => [status, total])) };
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
