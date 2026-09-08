import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  select: vi.fn(),
  limit: vi.fn(),
  where: vi.fn(),
}));
vi.mock("@/db/client", () => ({ db: { select: mocks.select } }));

import { eq } from "drizzle-orm";
import { sessions } from "@/db/schema";
import { sessionHasExpense, sessionPriceIsFixed } from "./player-price-query";
import { getSessionPlayerPrice } from "./player-price-summary-query";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.select.mockReturnValue({ from: () => ({ where: mocks.where }) });
  mocks.where.mockReturnValue({ limit: mocks.limit });
});

describe("Story current player price", () => {
  it.each([
    { playerPriceCents: 12525, hasExpense: true, priceIsFixed: true },
    { playerPriceCents: null, hasExpense: true, priceIsFixed: false },
    { playerPriceCents: 0, hasExpense: false, priceIsFixed: false },
  ])("reads only current public pricing facts: %j", async (price) => {
    mocks.limit.mockResolvedValue([price]);
    expect(await getSessionPlayerPrice("game-id")).toEqual(price);
    expect(mocks.select).toHaveBeenCalledWith({
      playerPriceCents: sessions.playerPriceCents,
      hasExpense: sessionHasExpense,
      priceIsFixed: sessionPriceIsFixed,
    });
    expect(mocks.where).toHaveBeenCalledWith(eq(sessions.id, "game-id"));
    expect(mocks.limit).toHaveBeenCalledWith(1);
  });

  it("returns null if the session no longer exists", async () => {
    mocks.limit.mockResolvedValue([]);
    expect(await getSessionPlayerPrice("missing")).toBeNull();
  });
});
