import { courtDirectoryCoverage } from "@/features/venues/coverage";
import { getServerEnv } from "@/lib/env";
import { checkRateLimit, rateLimitHeaders, requestIdentity } from "@/lib/rate-limit";

const mapStyles = new Set(["osm-bright", "dark-matter"]);

export async function GET(request: Request, { params }: { params: Promise<{ z: string; x: string; y: string }> }) {
  const { z, x, y } = await params;
  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);
  if (!courtDirectoryCoverage.allowsTile({ zoom, x: tileX, y: tileY })) {
    return Response.json({ error: "Tile is outside the Philippines map." }, { status: 404 });
  }

  // MapLibre requests many tiles concurrently. Sharding preserves the same hard
  // aggregate ceilings without making every cold map load contend on one row.
  const tileShard = Math.abs(zoom * 73_856_093 + tileX * 19_349_663 + tileY * 83_492_791);
  const globalShard = tileShard % 32;
  const visitorShard = tileShard % 8;
  const visitor = await requestIdentity();
  const [dailyBudget, visitorLimit] = await Promise.all([
    checkRateLimit({ scope: "philippines-map-tiles-global", limit: 78, windowSeconds: 86_400 }, `shard:${globalShard}`),
    checkRateLimit(
      { scope: "philippines-map-tiles", limit: 75, windowSeconds: 600 },
      `${visitor}:shard:${visitorShard}`,
    ),
  ]);
  const limit = dailyBudget.allowed ? visitorLimit : dailyBudget;
  if (!limit.allowed)
    return Response.json(
      { error: "Map requests are temporarily limited." },
      { status: 429, headers: { ...rateLimitHeaders(limit), "Cache-Control": "private, no-store" } },
    );

  const requestedStyle = new URL(request.url).searchParams.get("style") ?? "osm-bright";
  const style = mapStyles.has(requestedStyle) ? requestedStyle : "osm-bright";
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
    console.error("Philippines map tile failed", error instanceof Error ? error.message : "Unknown provider error");
    return Response.json({ error: "The map tile is temporarily unavailable." }, { status: 502 });
  }
}
