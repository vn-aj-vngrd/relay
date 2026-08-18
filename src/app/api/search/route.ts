import type { NextRequest } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { searchRequestSchema } from "@/features/search/domain";
import { searchRelay } from "@/features/search/queries";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user)
    return Response.json(
      { error: "Authentication required" },
      { status: 401, headers: { "Cache-Control": "private, no-store" } },
    );
  const parsed = searchRequestSchema.safeParse({
    q: request.nextUrl.searchParams.get("q") ?? "",
    type: request.nextUrl.searchParams.get("type") ?? "all",
    cursor: request.nextUrl.searchParams.get("cursor") ?? "0",
  });
  if (!parsed.success)
    return Response.json(
      { error: "Invalid search request" },
      { status: 400, headers: { "Cache-Control": "private, no-store" } },
    );
  try {
    const result = await searchRelay(user.id, parsed.data.q, parsed.data.type, parsed.data.cursor);
    return Response.json(result, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Global search failed", error);
    return Response.json(
      { error: "Search is temporarily unavailable" },
      { status: 500, headers: { "Cache-Control": "private, no-store" } },
    );
  }
}
