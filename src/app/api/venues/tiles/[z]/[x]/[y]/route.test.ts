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
    expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2);
    expect((await response.arrayBuffer()).byteLength).toBeGreaterThan(0);
    expect(error).toHaveBeenCalledOnce();
  });
});
