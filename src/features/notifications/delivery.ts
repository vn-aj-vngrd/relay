import "server-only";

import { createHmac, timingSafeEqual } from "node:crypto";

import { and, asc, eq, inArray, lt, lte, or } from "drizzle-orm";
import webPush from "web-push";

import { db } from "@/db/client";
import {
  notificationDeliveries,
  notificationPreferences,
  notifications,
  pushSubscriptions,
  sessionPlayers,
  sessions,
  users,
} from "@/db/schema";
import { getNotificationEnv, getPublicEnv } from "@/lib/env";

import { notificationPresentation } from "./domain";
import {
  categoryEnabled,
  channelAllowsNotification,
  type DeliveryChannel,
  isWithinQuietHours,
  notificationCategory,
  reminderTimingEnabled,
} from "./preferences";

function unsubscribeSignature(userId: string, secret: string) {
  return createHmac("sha256", secret)
    .update(`notification-email:${userId}`)
    .digest("base64url");
}

export function emailUnsubscribeToken(userId: string) {
  const secret = getNotificationEnv().dispatchSecret;
  return `${userId}.${unsubscribeSignature(userId, secret)}`;
}

export function verifyEmailUnsubscribeToken(token: string) {
  const [userId, supplied] = token.split(".");
  if (!userId || !supplied || !/^[0-9a-f-]{36}$/.test(userId)) return null;
  const expected = unsubscribeSignature(
    userId,
    getNotificationEnv().dispatchSecret
  );
  const left = Buffer.from(supplied);
  const right = Buffer.from(expected);
  return left.length === right.length && timingSafeEqual(left, right)
    ? userId
    : null;
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function sendEmail(input: {
  to: string;
  subject: string;
  body: string;
  href: string;
  userId: string;
  deliveryId: string;
}) {
  const env = getNotificationEnv();
  if (!env.resendApiKey || !env.fromEmail)
    throw new Error("EMAIL_NOT_CONFIGURED");
  const appUrl = getPublicEnv().NEXT_PUBLIC_APP_URL;
  const gameUrl = new URL(input.href, appUrl).toString();
  const unsubscribeUrl = new URL(
    `/api/notifications/unsubscribe?token=${encodeURIComponent(emailUnsubscribeToken(input.userId))}`,
    appUrl
  ).toString();
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${env.resendApiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": `relay-notification/${input.deliveryId}`,
    },
    body: JSON.stringify({
      from: env.fromEmail,
      to: [input.to],
      subject: input.subject,
      headers: {
        "List-Unsubscribe": `<${unsubscribeUrl}>`,
        "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
      },
      html: `<div style="font-family:Inter,Arial,sans-serif;max-width:560px;margin:auto;color:#191b20"><p style="font-size:12px;font-weight:700;color:#2563eb">RELAY</p><h1 style="font-size:24px">${escapeHtml(input.subject)}</h1><p style="font-size:15px;line-height:1.6;color:#5f6470">${escapeHtml(input.body)}</p><p><a href="${gameUrl}" style="display:inline-block;background:#2563eb;color:white;text-decoration:none;padding:11px 16px;border-radius:8px;font-weight:700">Open in Relay</a></p><p style="margin-top:32px;font-size:12px;color:#777"><a href="${unsubscribeUrl}">Unsubscribe from game reminder emails</a></p></div>`,
    }),
  });
  if (!response.ok) throw new Error(`EMAIL_${response.status}`);
}

async function sendPush(input: {
  endpoint: string;
  p256dh: string;
  auth: string;
  title: string;
  body: string;
  href: string;
}) {
  const env = getNotificationEnv();
  if (!env.vapidPublicKey || !env.vapidPrivateKey)
    throw new Error("PUSH_NOT_CONFIGURED");
  webPush.setVapidDetails(
    env.vapidSubject,
    env.vapidPublicKey,
    env.vapidPrivateKey
  );
  await webPush.sendNotification(
    {
      endpoint: input.endpoint,
      keys: { p256dh: input.p256dh, auth: input.auth },
    },
    JSON.stringify({
      title: input.title,
      body: input.body,
      href: input.href,
      tag: `relay:${input.href}`,
    }),
    { TTL: 60 * 60 * 24, urgency: "normal" }
  );
}

function retryAt(attempts: number) {
  return new Date(
    Date.now() + Math.min(6 * 60 * 60_000, 2 ** attempts * 60_000)
  );
}

export async function dispatchNotificationDeliveries(limit = 50) {
  const env = getNotificationEnv();
  if (!env.enabled) return { processed: 0, sent: 0, suppressed: 0, failed: 0 };
  const candidates = await db
    .select({ id: notificationDeliveries.id })
    .from(notificationDeliveries)
    .where(
      and(
        or(
          inArray(notificationDeliveries.status, ["pending", "failed"]),
          and(
            eq(notificationDeliveries.status, "sending"),
            lt(
              notificationDeliveries.updatedAt,
              new Date(Date.now() - 5 * 60_000)
            )
          )
        ),
        lte(notificationDeliveries.nextAttemptAt, new Date()),
        lte(notificationDeliveries.attempts, 4)
      )
    )
    .orderBy(asc(notificationDeliveries.nextAttemptAt))
    .limit(Math.min(100, Math.max(1, limit)));
  let sent = 0;
  let suppressed = 0;
  let failed = 0;

  for (const candidate of candidates) {
    const [claimed] = await db
      .update(notificationDeliveries)
      .set({ status: "sending", updatedAt: new Date() })
      .where(
        and(
          eq(notificationDeliveries.id, candidate.id),
          or(
            eq(notificationDeliveries.status, "pending"),
            eq(notificationDeliveries.status, "failed"),
            and(
              eq(notificationDeliveries.status, "sending"),
              lt(
                notificationDeliveries.updatedAt,
                new Date(Date.now() - 5 * 60_000)
              )
            )
          )
        )
      )
      .returning();
    if (!claimed) continue;
    const row = await db
      .select({
        delivery: notificationDeliveries,
        notification: notifications,
        preference: notificationPreferences,
        session: sessions,
        user: users,
        subscription: pushSubscriptions,
      })
      .from(notificationDeliveries)
      .innerJoin(
        notifications,
        eq(notificationDeliveries.notificationId, notifications.id)
      )
      .innerJoin(users, eq(notifications.userId, users.id))
      .leftJoin(
        notificationPreferences,
        eq(notificationPreferences.userId, users.id)
      )
      .leftJoin(sessions, eq(notifications.sessionId, sessions.id))
      .leftJoin(
        pushSubscriptions,
        eq(notificationDeliveries.pushSubscriptionId, pushSubscriptions.id)
      )
      .where(eq(notificationDeliveries.id, claimed.id))
      .then((rows) => rows[0]);
    if (!row) continue;

    const channel = row.delivery.channel as DeliveryChannel;
    const category = notificationCategory(row.notification.type);
    const categories =
      channel === "email"
        ? row.preference?.emailCategories
        : row.preference?.pushCategories;
    const enabled =
      channel === "email"
        ? row.preference?.emailEnabled
        : row.preference?.pushEnabled;
    const reminderEnabled = reminderTimingEnabled(
      row.notification.type,
      row.preference?.dayBeforeReminder ?? true,
      row.preference?.hourBeforeReminder ?? true
    );
    const sessionStillRelevant =
      !["session_tomorrow", "session_starting_soon"].includes(
        row.notification.type
      ) ||
      (row.session &&
        ["published", "live"].includes(row.session.status) &&
        Boolean(
          await db.query.sessionPlayers.findFirst({
            columns: { id: true },
            where: and(
              eq(sessionPlayers.sessionId, row.session.id),
              eq(sessionPlayers.userId, row.user.id),
              eq(sessionPlayers.rsvp, "going")
            ),
          })
        ));
    const allowed = Boolean(
      row.preference &&
        enabled &&
        category &&
        categories &&
        categoryEnabled(categories, category) &&
        channelAllowsNotification(channel, row.notification.type) &&
        reminderEnabled &&
        sessionStillRelevant &&
        (channel !== "push" || row.subscription)
    );
    if (!allowed) {
      suppressed += 1;
      await db
        .update(notificationDeliveries)
        .set({
          status: "suppressed",
          errorCode: "preference_or_policy",
          updatedAt: new Date(),
        })
        .where(eq(notificationDeliveries.id, claimed.id));
      continue;
    }

    const quiet = isWithinQuietHours(
      new Date(),
      row.preference!.timeZone,
      row.preference!.quietHoursStart,
      row.preference!.quietHoursEnd
    );
    if (quiet) {
      if (channel === "email" && category === "reminders") {
        suppressed += 1;
        await db
          .update(notificationDeliveries)
          .set({
            status: "suppressed",
            errorCode: "quiet_hours",
            updatedAt: new Date(),
          })
          .where(eq(notificationDeliveries.id, claimed.id));
      } else {
        await db
          .update(notificationDeliveries)
          .set({
            status: "pending",
            nextAttemptAt: new Date(Date.now() + 30 * 60_000),
            updatedAt: new Date(),
          })
          .where(eq(notificationDeliveries.id, claimed.id));
      }
      continue;
    }

    const presentation = notificationPresentation({
      type: row.notification.type,
      sessionId: row.notification.sessionId,
      sessionTitle: row.session?.title ?? null,
      payload: row.notification.payload,
    });
    try {
      if (channel === "email")
        await sendEmail({
          to: row.user.email,
          subject: presentation.title,
          body: presentation.body,
          href: presentation.href,
          userId: row.user.id,
          deliveryId: row.delivery.id,
        });
      else
        await sendPush({
          endpoint: row.subscription!.endpoint,
          p256dh: row.subscription!.p256dh,
          auth: row.subscription!.auth,
          title: presentation.title,
          body: presentation.body,
          href: presentation.href,
        });
      sent += 1;
      await db
        .update(notificationDeliveries)
        .set({
          status: "sent",
          sentAt: new Date(),
          attempts: claimed.attempts + 1,
          errorCode: null,
          updatedAt: new Date(),
        })
        .where(eq(notificationDeliveries.id, claimed.id));
    } catch (error) {
      const statusCode =
        typeof error === "object" && error && "statusCode" in error
          ? Number(error.statusCode)
          : null;
      if (
        channel === "push" &&
        (statusCode === 404 || statusCode === 410) &&
        row.subscription
      ) {
        await db.transaction(async (tx) => {
          await tx
            .update(notificationDeliveries)
            .set({
              status: "suppressed",
              attempts: claimed.attempts + 1,
              errorCode: "expired_subscription",
              updatedAt: new Date(),
            })
            .where(eq(notificationDeliveries.id, claimed.id));
          await tx
            .delete(pushSubscriptions)
            .where(eq(pushSubscriptions.id, row.subscription!.id));
        });
        suppressed += 1;
      } else {
        failed += 1;
        const attempts = claimed.attempts + 1;
        await db
          .update(notificationDeliveries)
          .set({
            status: "failed",
            attempts,
            nextAttemptAt: retryAt(attempts),
            errorCode:
              error instanceof Error ? error.message.slice(0, 80) : "unknown",
            updatedAt: new Date(),
          })
          .where(eq(notificationDeliveries.id, claimed.id));
      }
    }
  }
  return { processed: candidates.length, sent, suppressed, failed };
}
