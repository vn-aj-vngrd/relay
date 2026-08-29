import type { NextRequest } from "next/server";
import { z } from "zod";

import { getCurrentUser } from "@/features/auth/session";
import { parseGameCursor } from "@/features/sessions/game-pagination";
import { getGameCollectionMonth, getGameCollectionPage } from "@/features/sessions/queries";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

const phaseSchema = z.enum(["upcoming", "past"]);
const monthSchema = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/);

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );

  const limit = await checkRateLimit({ scope: "game-pagination", limit: 120, windowSeconds: 60 }, `user:${user.id}`);
  if (!limit.allowed)
    return Response.json(
      { error: "Game history is temporarily limited. Try again shortly." },
      { status: 429, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );

  const monthValue = request.nextUrl.searchParams.get("month");
  const month = monthSchema.safeParse(monthValue);
  if (monthValue) {
    if (!month.success)
      return Response.json(
        { error: "Invalid calendar month" },
        { status: 400, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
      );
    try {
      return Response.json(await getGameCollectionMonth(user.id, month.data), {
        headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" },
      });
    } catch (error) {
      console.error("Game calendar loading failed", error instanceof Error ? error.message : "Unknown error");
      return Response.json(
        { error: "This month could not be loaded." },
        { status: 500, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
      );
    }
  }

  const phase = phaseSchema.safeParse(request.nextUrl.searchParams.get("phase"));
  const cursorValue = request.nextUrl.searchParams.get("cursor");
  const cursor = parseGameCursor(cursorValue);
  if (!phase.success || (cursorValue && !cursor))
    return Response.json(
      { error: "Invalid game page request" },
      { status: 400, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );

  try {
    return Response.json(await getGameCollectionPage(user.id, phase.data, cursor), {
      headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Game pagination failed", phase.data, error instanceof Error ? error.message : "Unknown error");
    return Response.json(
      { error: "More games could not be loaded." },
      { status: 500, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );
  }
}
