import { Buffer } from "node:buffer";

import { courtDirectoryCoverage } from "@/features/venues/coverage";
import { getServerEnv } from "@/lib/env";
import {
  checkRateLimit,
  rateLimitHeaders,
  requestIdentity,
} from "@/lib/rate-limit";

type MapStyle = "osm-bright" | "dark-matter";
const fallbackTiles = {
  "osm-bright": Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGN4/fIJAAV7ArmVLcmiAAAAAElFTkSuQmCC",
      "base64"
    )
  ),
  "dark-matter": Uint8Array.from(
    Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAIAAACQd1PeAAAADElEQVR4nGMQlFAHAACOAFFPOrt4AAAAAElFTkSuQmCC",
      "base64"
    )
  ),
} satisfies Record<MapStyle, Uint8Array>;
const providerConcurrency = 4;
type ProviderQueueEntry = {
  resolve: () => void;
  reject: (reason: unknown) => void;
  signal: AbortSignal;
  abort: () => void;
};
let activeProviderRequests = 0;
const providerQueue: ProviderQueueEntry[] = [];

async function acquireProviderSlot(signal: AbortSignal) {
  signal.throwIfAborted();
  if (activeProviderRequests < providerConcurrency) {
    activeProviderRequests += 1;
    return;
  }

  await new Promise<void>((resolve, reject) => {
    const entry: ProviderQueueEntry = {
      resolve,
      reject,
      signal,
      abort: () => {
        const index = providerQueue.indexOf(entry);
        if (index !== -1) providerQueue.splice(index, 1);
        reject(signal.reason);
      },
    };
    signal.addEventListener("abort", entry.abort, { once: true });
    providerQueue.push(entry);
  });
}

function releaseProviderSlot() {
  activeProviderRequests -= 1;
  // Newer requests represent the current viewport after a rapid zoom.
  let entry = providerQueue.pop();
  while (entry) {
    entry.signal.removeEventListener("abort", entry.abort);
    if (!entry.signal.aborted) {
      activeProviderRequests += 1;
      entry.resolve();
      return;
    }
    entry.reject(entry.signal.reason);
    entry = providerQueue.pop();
  }
}

async function withProviderSlot<T>(
  signal: AbortSignal,
  request: () => Promise<T>
) {
  await acquireProviderSlot(signal);
  try {
    return await request();
  } finally {
    releaseProviderSlot();
  }
}

async function fetchProviderTile(endpoint: URL, requestSignal: AbortSignal) {
  let lastError: unknown;
  for (let attempt = 0; attempt < 3; attempt += 1) {
    requestSignal.throwIfAborted();
    try {
      const providerSignal = AbortSignal.any([
        requestSignal,
        AbortSignal.timeout(6_000),
      ]);
      const response = await withProviderSlot(providerSignal, () =>
        fetch(endpoint, {
          next: { revalidate: 2_592_000 },
          signal: providerSignal,
        })
      );
      if (response.ok) return response;
      lastError = new Error(`Geoapify returned ${response.status}`);
      if (response.status < 500 && response.status !== 429) break;
    } catch (error) {
      requestSignal.throwIfAborted();
      lastError = error;
    }
  }
  throw lastError instanceof Error
    ? lastError
    : new Error("Geoapify tile request failed");
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ z: string; x: string; y: string }> }
) {
  const { z, x, y } = await params;
  const zoom = Number(z);
  const tileX = Number(x);
  const tileY = Number(y);
  if (!courtDirectoryCoverage.allowsTile({ zoom, x: tileX, y: tileY })) {
    return Response.json(
      { error: "Tile is outside the Philippines map." },
      { status: 404 }
    );
  }

  // Edge caching absorbs repeat requests in production. `next dev` has no edge
  // cache, so charging its persistent buckets would exhaust production-style
  // limits during ordinary local reloads and leave MapLibre with 429 tile errors.
  if (process.env.NODE_ENV === "production") {
    // Keep the provider budget global. Coordinate-based shards made popular
    // Cebu tiles exhaust one tiny bucket while most of the daily budget sat idle.
    const visitor = await requestIdentity();
    const [dailyBudget, visitorLimit] = await Promise.all([
      checkRateLimit(
        {
          scope: "philippines-map-tiles-global",
          limit: 2_500,
          windowSeconds: 86_400,
        },
        "global"
      ),
      checkRateLimit(
        { scope: "philippines-map-tiles", limit: 600, windowSeconds: 600 },
        visitor
      ),
    ]);
    const limit = dailyBudget.allowed ? visitorLimit : dailyBudget;
    if (!limit.allowed)
      return Response.json(
        { error: "Map requests are temporarily limited." },
        {
          status: 429,
          headers: {
            ...rateLimitHeaders(limit),
            "Cache-Control": "private, no-store",
          },
        }
      );
  }

  const requestedStyle =
    new URL(request.url).searchParams.get("style") ?? "osm-bright";
  const style: MapStyle =
    requestedStyle === "dark-matter" ? "dark-matter" : "osm-bright";
  const endpoint = new URL(
    `https://maps.geoapify.com/v1/tile/${style}/${zoom}/${tileX}/${tileY}@2x.png`
  );
  endpoint.searchParams.set("apiKey", getServerEnv().GEOAPIFY_API_KEY);

  try {
    const response = await fetchProviderTile(endpoint, request.signal);
    return new Response(await response.arrayBuffer(), {
      headers: {
        "Content-Type": response.headers.get("content-type") || "image/png",
        "Cache-Control":
          "public, max-age=86400, s-maxage=2592000, stale-while-revalidate=604800",
      },
    });
  } catch (error) {
    if (request.signal.aborted) return new Response(null, { status: 499 });
    console.error(
      "Philippines map tile failed",
      error instanceof Error ? error.message : "Unknown provider error"
    );
    return new Response(fallbackTiles[style], {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control":
          "public, max-age=60, s-maxage=60, stale-while-revalidate=300",
        "X-Relay-Tile-Fallback": "1",
      },
    });
  }
}
