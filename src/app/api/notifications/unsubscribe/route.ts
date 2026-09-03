import { eq } from "drizzle-orm";
import type { NextRequest } from "next/server";

import { db } from "@/db/client";
import { notificationPreferences } from "@/db/schema";
import { verifyEmailUnsubscribeToken } from "@/features/notifications/delivery";

function tokenFrom(request: NextRequest) {
  return request.nextUrl.searchParams.get("token") ?? "";
}

export async function GET(request: NextRequest) {
  const token = tokenFrom(request);
  if (!verifyEmailUnsubscribeToken(token))
    return new Response("This unsubscribe link is invalid.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  return new Response(
    `<!doctype html><html lang="en"><meta name="viewport" content="width=device-width"><title>Relay email preferences</title><body style="font-family:Arial,sans-serif;max-width:560px;margin:64px auto;padding:0 20px;color:#191b20"><h1>Turn off game reminder emails?</h1><p>In-app notifications will remain available. You can turn email back on from Relay Preferences.</p><form method="post" action="?token=${encodeURIComponent(token)}"><button style="padding:11px 16px;border:0;border-radius:8px;background:#2563eb;color:#fff;font-weight:700">Turn off reminder emails</button></form></body></html>`,
    {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}

export async function POST(request: NextRequest) {
  const userId = verifyEmailUnsubscribeToken(tokenFrom(request));
  if (!userId)
    return new Response("This unsubscribe link is invalid.", {
      status: 400,
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    });
  await db
    .update(notificationPreferences)
    .set({ emailEnabled: false, updatedAt: new Date() })
    .where(eq(notificationPreferences.userId, userId));
  return new Response(
    "Relay game reminder emails are now off. You can change this again from Preferences.",
    {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-store",
      },
    }
  );
}
