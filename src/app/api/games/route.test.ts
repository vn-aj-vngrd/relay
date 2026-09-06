import { NextRequest } from "next/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  user: vi.fn(),
  page: vi.fn(),
  month: vi.fn(),
  limit: vi.fn(),
}));
vi.mock("@/features/auth/session", () => ({ getCurrentUser: mocks.user }));
vi.mock("@/features/sessions/queries", () => ({
  getGameCollectionPage: mocks.page,
  getGameCollectionMonth: mocks.month,
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: mocks.limit,
  rateLimitHeaders: () => ({}),
}));

import { defaultGameLibraryFilters } from "@/features/sessions/game-library-filters";
import {
  encodeGameCursor,
  gameCursorContext,
} from "@/features/sessions/game-pagination";
import { GET } from "./route";

const userId = "b07a50cf-8ba7-452e-a421-ab264c9b7e6e";
const request = (query: string) =>
  new NextRequest(`http://localhost/api/games?${query}`);

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: userId });
  mocks.limit.mockResolvedValue({ allowed: true });
  mocks.page.mockResolvedValue({ items: [], nextCursor: null });
  mocks.month.mockResolvedValue({ upcoming: [], past: [] });
});

describe("Games filtered API", () => {
  it("requires authentication before querying history", async () => {
    mocks.user.mockResolvedValue(null);
    expect((await GET(request("phase=past&when=all"))).status).toBe(401);
    expect(mocks.page).not.toHaveBeenCalled();
  });
  it("passes all filters to server pagination and never accepts a supplied account id", async () => {
    const response = await GET(
      request(
        "phase=past&when=all&role=cohost&response=declined&group=none&venue=Central&q=Mika&cancelled=true&userId=other"
      )
    );
    expect(response.status).toBe(200);
    expect(response.headers.get("Cache-Control")).toBe("private, no-store");
    expect(mocks.page).toHaveBeenCalledWith(
      userId,
      "past",
      null,
      "all",
      expect.objectContaining({
        when: "all",
        role: "cohost",
        response: "declined",
        group: "none",
        venue: "Central",
        q: "Mika",
        cancelled: "true",
      })
    );
  });
  it("applies the same filters to calendar months", async () => {
    expect(
      (
        await GET(
          request(
            "month=2020-01&when=range&from=2020-01-01&until=2020-01-31&role=host"
          )
        )
      ).status
    ).toBe(200);
    expect(mocks.month).toHaveBeenCalledWith(
      userId,
      "2020-01",
      "all",
      expect.objectContaining({
        when: "range",
        role: "host",
        from: "2020-01-01",
        until: "2020-01-31",
      })
    );
  });
  it.each([
    "when=range",
    "when=range&from=2026-02-30&until=2026-03-01",
    "when=range&from=2026-08-02&until=2026-08-01",
    "role=admin",
    "group=not-a-uuid",
    "cursor=bad",
  ])("rejects invalid input before querying: %s", async (query) => {
    expect((await GET(request(`phase=upcoming&${query}`))).status).toBe(400);
    expect(mocks.page).not.toHaveBeenCalled();
  });
  it("accepts a matching stable cursor and rejects a cursor from another filter or account", async () => {
    const filters = { ...defaultGameLibraryFilters, when: "past" as const };
    const cursor = encodeGameCursor({
      at: new Date("2026-07-01T00:00:00Z"),
      id: "3f50ee13-472f-4dc0-9e9b-df14470668ea",
      snapshot: "2026-08-01T00:00:00.000Z",
      context: gameCursorContext(userId, "past", "all", filters),
    });
    expect(
      (await GET(request(`phase=past&when=past&cursor=${cursor}`))).status
    ).toBe(200);
    expect(
      (await GET(request(`phase=past&when=past&role=host&cursor=${cursor}`)))
        .status
    ).toBe(400);
    mocks.user.mockResolvedValue({ id: "another-account" });
    expect(
      (await GET(request(`phase=past&when=past&cursor=${cursor}`))).status
    ).toBe(400);
  });
});
