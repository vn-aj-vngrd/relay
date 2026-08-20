import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { parseGeoapifyResults, venueSearchQuerySchema } from "@/features/venues/geoapify";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit, rateLimitHeaders } from "@/lib/rate-limit";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to search courts." }, { status: 401 });

  const limit = await checkRateLimit({ scope: "venue-autocomplete", limit: 60, windowSeconds: 60 }, `user:${user.id}`);
  if (!limit.allowed)
    return NextResponse.json(
      { error: "Court search is temporarily limited. Try again shortly." },
      { status: 429, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );

  const query = venueSearchQuerySchema.safeParse(request.nextUrl.searchParams.get("q"));
  if (!query.success)
    return NextResponse.json({ suggestions: [] }, { headers: { "Cache-Control": "private, no-store" } });

  const env = getServerEnv();
  const endpoint = new URL("/v1/geocode/autocomplete", env.GEOAPIFY_API_URL);
  endpoint.searchParams.set("text", query.data);
  endpoint.searchParams.set("filter", "countrycode:ph");
  endpoint.searchParams.set("bias", "countrycode:ph");
  endpoint.searchParams.set("lang", "en");
  endpoint.searchParams.set("format", "json");
  endpoint.searchParams.set("limit", "6");
  endpoint.searchParams.set("apiKey", env.GEOAPIFY_API_KEY);

  try {
    const response = await fetch(endpoint, {
      headers: { Accept: "application/json" },
      cache: "no-store",
      signal: AbortSignal.timeout(5_000),
    });
    if (!response.ok) throw new Error(`Geoapify returned ${response.status}`);
    const suggestions = parseGeoapifyResults(await response.json());
    return NextResponse.json(
      { suggestions },
      { headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("Court search failed", error instanceof Error ? error.message : "Unknown provider error");
    return NextResponse.json({ error: "Court search is temporarily unavailable." }, { status: 502 });
  }
}
