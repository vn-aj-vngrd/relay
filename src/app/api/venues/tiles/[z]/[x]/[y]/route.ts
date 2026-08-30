import { isValidCebuTile } from "@/features/venues/tile-boundary";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit, rateLimitHeaders, requestIdentity } from "@/lib/rate-limit";

const mapStyles = new Set(["osm-bright-grey", "dark-matter"]);

export async function GET(request: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await params;
  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);
  if (!isValidCebuTile(zoom, tileX, tileY)) {
    return Response.json({ error: "Tile is outside the Cebu map." }, { status: 404 });
  }

  const [dailyBudget, visitorLimit] = await Promise.all([
    checkRateLimit({ scope: "cebu-map-tiles-global", limit: 2_500, windowSeconds: 86_400 }, "global"),
    checkRateLimit({ scope: "cebu-map-tiles", limit: 600, windowSeconds: 600 }, await requestIdentity()),
  ]);
  const limit = dailyBudget.allowed ? visitorLimit : dailyBudget;
  if (!limit.allowed)
    return Response.json(
      { error: "Map requests are temporarily limited." },
      { status: 429, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );

  const requestedStyle = new URL(request.url).searchParams.get("style") ?? "osm-bright-grey";
  const style = mapStyles.has(requestedStyle) ? requestedStyle : "osm-bright-grey";
  const endpoint = new URL(`https://maps.geoapify.com/v1/tile/${style}/${zoom}/${tileX}/${tileY}@2x.png`);
  endpoint.searchParams.set("apiKey", getServerEnv().GEOAPIFY_API_KEY);

  try {
    const response = await fetch(endpoint, {
      next: { revalidate: 2_592_000 },
      signal: AbortSignal.timeout(8_000),
    });
    if (!response.ok) throw new Error(`Geoapify returned ${response.status}`);

    return new Response(await response.arrayBuffer(), {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/png",
        "Cache-Control": "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    console.error("Cebu map tile failed", error instanceof Error ? error.message : "Unknown provider error");
    return Response.json({ error: "The map tile is temporarily unavailable." }, { status: 502 });
  }
}
