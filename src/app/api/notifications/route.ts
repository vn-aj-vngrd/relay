import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { parseNotificationCursor } from "@/features/notifications/pagination";
import { getNotificationPage, type NotificationFilter } from "@/features/notifications/queries";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );

  const limit = await checkRateLimit(
    { scope: "notification-pagination", limit: 120, windowSeconds: 60 },
    `user:${user.id}`,
  );
  if (!limit.allowed)
    return Response.json(
      { error: "Notification history is temporarily limited. Try again shortly." },
      { status: 429, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );

  const filterValue = request.nextUrl.searchParams.get("filter") ?? "all";
  const filter: NotificationFilter | null = filterValue === "all" || filterValue === "unread" ? filterValue : null;
  const cursorValue = request.nextUrl.searchParams.get("cursor");
  const cursor = parseNotificationCursor(cursorValue);
  if (!filter || (cursorValue && !cursor))
    return Response.json(
      { error: "Invalid notification page request" },
      { status: 400, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );

  try {
    return Response.json(await getNotificationPage(user.id, filter, cursor), {
      headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Notification pagination failed", error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      { error: "More notifications could not be loaded." },
      { status: 500, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );
  }
}
