import { and, eq } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { z } from "zod";

import { db } from "@/db/client";
import { notificationPreferences, pushSubscriptions } from "@/db/schema";
import { getCurrentUser } from "@/features/auth/session";
import { defaultCategoryPreferences } from "@/features/notifications/preferences";
import { getNotificationEnv } from "@/lib/env";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const subscriptionSchema = z.object({
  endpoint: z
    .url()
    .max(2048)
    .refine((value) => value.startsWith("https://")),
  keys: z.object({ p256dh: z.string().min(16).max(512), auth: z.string().min(8).max(256) }),
});

function deviceLabel(userAgent: string) {
  if (/iPhone|iPad/i.test(userAgent)) return "iPhone or iPad";
  if (/Android/i.test(userAgent)) return "Android device";
  if (/Macintosh/i.test(userAgent)) return "Mac";
  if (/Windows/i.test(userAgent)) return "Windows device";
  return "Web browser";
}

export async function GET() {
  const env = getNotificationEnv();
  return Response.json(
    {
      enabled: env.enabled && Boolean(env.vapidPublicKey && env.vapidPrivateKey),
      publicKey: env.vapidPublicKey || null,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const limit = await checkRateLimit({ scope: "push-subscription", limit: 10, windowSeconds: 3600 }, `user:${user.id}`);
  if (!limit.allowed)
    return Response.json(
      { error: "Push setup is temporarily limited." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  const parsed = subscriptionSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid push subscription" }, { status: 400 });
  const existing = await db.query.pushSubscriptions.findFirst({
    columns: { userId: true },
    where: eq(pushSubscriptions.endpoint, parsed.data.endpoint),
  });
  if (existing && existing.userId !== user.id)
    return Response.json({ error: "This device subscription belongs to another account." }, { status: 409 });
  const values = {
    userId: user.id,
    endpoint: parsed.data.endpoint,
    p256dh: parsed.data.keys.p256dh,
    auth: parsed.data.keys.auth,
    deviceLabel: deviceLabel(request.headers.get("user-agent") ?? ""),
    lastUsedAt: new Date(),
    updatedAt: new Date(),
  };
  await db.transaction(async (tx) => {
    await tx
      .insert(pushSubscriptions)
      .values(values)
      .onConflictDoUpdate({ target: pushSubscriptions.endpoint, set: values });
    await tx
      .insert(notificationPreferences)
      .values({
        userId: user.id,
        emailCategories: defaultCategoryPreferences,
        pushCategories: defaultCategoryPreferences,
        pushEnabled: true,
      })
      .onConflictDoUpdate({
        target: notificationPreferences.userId,
        set: { pushEnabled: true, updatedAt: new Date() },
      });
  });
  return Response.json({ success: true }, { headers: { ...rateLimitHeaders(limit), "Cache-Control": "no-store" } });
}

export async function DELETE(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return Response.json({ error: "Authentication required" }, { status: 401 });
  const limit = await checkRateLimit(
    { scope: "push-subscription-remove", limit: 20, windowSeconds: 60 },
    `user:${user.id}`,
  );
  if (!limit.allowed)
    return Response.json(
      { error: "Push changes are temporarily limited." },
      { status: 429, headers: rateLimitHeaders(limit) },
    );
  const parsed = z.object({ endpoint: z.url().max(2048) }).safeParse(await request.json().catch(() => null));
  if (!parsed.success) return Response.json({ error: "Invalid push subscription" }, { status: 400 });
  await db
    .delete(pushSubscriptions)
    .where(and(eq(pushSubscriptions.userId, user.id), eq(pushSubscriptions.endpoint, parsed.data.endpoint)));
  return Response.json({ success: true }, { headers: { "Cache-Control": "no-store" } });
}
