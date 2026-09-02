import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  checkRateLimit: vi.fn(),
  requestIdentity: vi.fn(),
}));

vi.mock("@/lib/env", () => ({ getServerEnv: () => ({ GEOAPIFY_API_KEY: "test-key" }) }));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.checkRateLimit,
  rateLimitHeaders: () => ({ "Retry-After": "60" }),
  requestIdentity: mocks.requestIdentity,
}));

import { GET } from "./route";

const params = Promise.resolve({ z: "12", x: "3456", y: "1928" });

describe("venue tile route", () => {
  beforeEach(() => {
    vi.stubEnv("NODE_ENV", "development");
    mocks.checkRateLimit.mockResolvedValue({
      allowed: false,
      limit: 1,
      remaining: 0,
      retryAfterSeconds: 60,
    });
    mocks.requestIdentity.mockResolvedValue("ip:test");
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(new Uint8Array([137, 80, 78, 71]), {
          status: 200,
          headers: { "Content-Type": "image/png" },
        }),
      ),
    );
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
    vi.clearAllMocks();
  });

  it("does not consume persistent production tile limits during next dev", async () => {
    const response = await GET(new Request("http://localhost/api/venues/tiles/12/3456/1928?style=osm-bright"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(mocks.checkRateLimit).not.toHaveBeenCalled();
  });

  it("bounds zoom bursts so provider requests do not time out under concurrency", async () => {
    let activeRequests = 0;
    let maximumConcurrency = 0;
    vi.mocked(fetch).mockImplementation(async () => {
      activeRequests += 1;
      maximumConcurrency = Math.max(maximumConcurrency, activeRequests);
      if (activeRequests > 4) {
        activeRequests -= 1;
        throw new TypeError("connection timed out");
      }
      await new Promise((resolve) => setTimeout(resolve, 5));
      activeRequests -= 1;
      return new Response(new Uint8Array([137, 80, 78, 71]), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    });
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const responses = await Promise.all(
      Array.from({ length: 12 }, () =>
        GET(new Request("http://localhost/api/venues/tiles/12/3456/1928?style=osm-bright"), { params }),
      ),
    );

    expect(responses.every((response) => response.headers.get("x-relay-tile-fallback") === null)).toBe(true);
    expect(maximumConcurrency).toBeLessThanOrEqual(4);
    expect(error).not.toHaveBeenCalled();
  });

  it("drops obsolete queued tiles when MapLibre cancels them during zoom", async () => {
    let releaseProvider!: () => void;
    const providerGate = new Promise<void>((resolve) => {
      releaseProvider = resolve;
    });
    vi.mocked(fetch).mockImplementation(async () => {
      await providerGate;
      return new Response(new Uint8Array([137, 80, 78, 71]), {
        status: 200,
        headers: { "Content-Type": "image/png" },
      });
    });
    const activeRequests = Array.from({ length: 4 }, () =>
      GET(new Request("http://localhost/api/venues/tiles/12/3456/1928?style=osm-bright"), { params }),
    );
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(4));

    const obsoleteTile = new AbortController();
    const obsoleteResponse = GET(
      new Request("http://localhost/api/venues/tiles/12/3456/1928?style=osm-bright", {
        signal: obsoleteTile.signal,
      }),
      { params },
    );
    obsoleteTile.abort();

    expect((await obsoleteResponse).status).toBe(499);
    expect(fetch).toHaveBeenCalledTimes(4);
    releaseProvider();
    await Promise.all(activeRequests);
  });

  it("returns a valid short-cached fallback tile when the provider times out", async () => {
    vi.mocked(fetch).mockRejectedValue(new TypeError("fetch failed"));
    const error = vi.spyOn(console, "error").mockImplementation(() => undefined);

    const response = await GET(new Request("http://localhost/api/venues/tiles/12/3456/1928?style=osm-bright"), {
      params,
    });

    expect(response.status).toBe(200);
    expect(response.headers.get("content-type")).toBe("image/png");
    expect(response.headers.get("x-relay-tile-fallback")).toBe("1");
    expect(response.headers.get("cache-control")).toContain("max-age=60");
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(3);
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
    expect(error).toHaveBeenCalledOnce();
  });
});
