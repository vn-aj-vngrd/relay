import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { groupFilterContext } from "@/features/groups/collection-query";
import { parseGroupFilters } from "@/features/groups/filters";
import { parseGroupCursor } from "@/features/groups/pagination";
import { getGroupCollectionPage } from "@/features/groups/queries";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );

  const limit = await checkRateLimit(
    { scope: "group-pagination", limit: 120, windowSeconds: 60 },
    `user:${user.id}`
  );
  if (!limit.allowed)
    return Response.json(
      { error: "Group loading is temporarily limited. Try again shortly." },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );

  const cursorValue = request.nextUrl.searchParams.get("cursor");
  const cursor = parseGroupCursor(cursorValue);
  const filters = parseGroupFilters(request.nextUrl.searchParams);
  if (
    !filters.success ||
    (cursorValue &&
      (!cursor ||
        cursor.context !== groupFilterContext(user.id, filters.data) ||
        cursor.upcoming === undefined ||
        !cursor.snapshot))
  )
    return Response.json(
      { error: "Invalid group page request" },
      {
        status: 400,
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );

  try {
    return Response.json(
      await getGroupCollectionPage(user.id, cursor, filters.data),
      {
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Group pagination failed",
      error instanceof Error ? error.message : "Unknown error"
    );
    return Response.json(
      { error: "More groups could not be loaded." },
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
