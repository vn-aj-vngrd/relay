import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import {
  openGamesFilterSchema,
  parseOpenGameCursor,
} from "@/features/sessions/open-games";
import { discoverOpenGames } from "@/features/sessions/open-games-queries";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } }
    );

  const limit = await checkRateLimit(
    { scope: "open-games", limit: 120, windowSeconds: 60 },
    `user:${user.id}`
  );
  if (!limit.allowed)
    return Response.json(
      { error: "Open games are temporarily limited. Try again shortly." },
      {
        status: 429,
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );

  const parsedFilters = openGamesFilterSchema.safeParse({
    date: request.nextUrl.searchParams.get("date") ?? "any",
    dateFrom: request.nextUrl.searchParams.get("dateFrom") ?? "",
    dateTo: request.nextUrl.searchParams.get("dateTo") ?? "",
    time: request.nextUrl.searchParams.get("time") ?? "any",
    timeFrom: request.nextUrl.searchParams.get("timeFrom") ?? "",
    timeTo: request.nextUrl.searchParams.get("timeTo") ?? "",
    location: request.nextUrl.searchParams.get("location") ?? "",
    available: request.nextUrl.searchParams.get("available") ?? undefined,
  });
  const cursorValue = request.nextUrl.searchParams.get("cursor");
  const cursor = parseOpenGameCursor(cursorValue);
  if (!parsedFilters.success || (cursorValue && !cursor))
    return Response.json(
      { error: "Invalid Open games request" },
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
      await discoverOpenGames(user.id, parsedFilters.data, cursor),
      {
        headers: {
          ...rateLimitHeaders(limit),
          "Cache-Control": "private, no-store",
        },
      }
    );
  } catch (error) {
    console.error(
      "Open games loading failed",
      error instanceof Error ? error.message : "Unknown error"
    );
    return Response.json(
      { error: "Open games could not be loaded." },
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
