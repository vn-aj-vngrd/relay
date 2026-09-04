import type { NextRequest } from "next/server";
import { z } from "zod";

import { getAuthorizedAal2Admin } from "@/features/admin/auth";
import { parseAdminCursor } from "@/features/admin/cursor";
import {
  getAdminAuditLog,
  getAdminSessions,
  getAdminUsers,
  getAdminVenueChangeRequests,
  getAdminVenues,
} from "@/features/admin/queries";
import { adminResources } from "@/features/admin/records";
import { getAdminFeedback } from "@/features/feedback/queries";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const resourceSchema = z.enum(adminResources);

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ resource: string }> }
) {
  const admin = await getAuthorizedAal2Admin();
  if (!admin)
    return Response.json(
      { error: "Administrator access required" },
      { status: 403, headers: { "Cache-Control": "private, no-store" } }
    );

  const resource = resourceSchema.safeParse((await params).resource);
  if (!resource.success)
    return Response.json(
      { error: "Unknown admin resource" },
      { status: 404, headers: { "Cache-Control": "private, no-store" } }
    );

  const limit = await checkRateLimit(
    { scope: "admin-pagination", limit: 180, windowSeconds: 60 },
    `user:${admin.id}`
  );
  if (!limit.allowed)
    return Response.json(
      { error: "Too many admin requests. Try again shortly." },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );

  const cursorValue = request.nextUrl.searchParams.get("cursor");
  const cursor = parseAdminCursor(cursorValue);
  if (cursorValue && !cursor)
    return Response.json(
      { error: "Invalid pagination cursor" },
      {
        status: 400,
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 100) ?? "";
  const status = request.nextUrl.searchParams.get("status")?.slice(0, 30) ?? "";
  const type = request.nextUrl.searchParams.get("type")?.slice(0, 30) ?? "";

  try {
    const page =
      resource.data === "users"
        ? await getAdminUsers({ query, cursor })
        : resource.data === "sessions"
          ? await getAdminSessions({ query, status, cursor })
          : resource.data === "venues"
            ? await getAdminVenues({ query, status, cursor })
            : resource.data === "court-requests"
              ? await getAdminVenueChangeRequests({
                  query,
                  status,
                  type,
                  cursor,
                })
              : resource.data === "feedback"
                ? await getAdminFeedback({ query, status, type, cursor })
                : await getAdminAuditLog(cursor);

    return Response.json(
      { items: page.items, nextCursor: page.nextCursor },
      {
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Admin pagination failed",
      resource.data,
      error instanceof Error ? error.message : "Unknown error"
    );
    return Response.json(
      { error: "Admin records are temporarily unavailable." },
      {
        status: 500,
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );
  }
}
