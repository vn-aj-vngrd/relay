import type { NextRequest } from "next/server";

import { dispatchNotificationDeliveries } from "@/features/notifications/delivery";
import { getNotificationEnv } from "@/lib/env";

export const maxDuration = 60;

export async function POST(request: NextRequest) {
  const env = getNotificationEnv();
  const authorization = request.headers.get("authorization");
  if (!env.dispatchSecret || authorization !== `Bearer ${env.dispatchSecret}`)
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  if (!env.enabled) return Response.json({ error: "Notification delivery is disabled" }, { status: 503 });
  try {
    return Response.json(await dispatchNotificationDeliveries(), {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    console.error("Notification dispatch failed", error instanceof Error ? error.name : "UnknownError");
    return Response.json({ error: "Notification dispatch failed" }, { status: 500 });
  }
}
