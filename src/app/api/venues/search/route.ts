import { type NextRequest, NextResponse } from "next/server";

import { getCurrentUser } from "@/features/auth/session";
import { parseGeoapifyResults, venueSearchQuerySchema } from "@/features/venues/geoapify";
import { getServerEnv } from "@/lib/env";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Sign in to search venues." }, { status: 401 });

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
    return NextResponse.json({ suggestions }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    console.error("Venue search failed", error instanceof Error ? error.message : "Unknown provider error");
    return NextResponse.json({ error: "Venue search is temporarily unavailable." }, { status: 502 });
  }
}
