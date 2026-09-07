import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  rows: vi.fn(),
  session: vi.fn(),
  player: vi.fn(),
  set: vi.fn(),
  insert: vi.fn(),
  remove: vi.fn(),
}));
vi.mock("@/db/client", () => ({
  db: {
    transaction: async (work: (tx: unknown) => Promise<unknown>) => {
      const selection = {
        from: () => selection,
        innerJoin: () => selection,
        where: mocks.rows,
      };
      return work({
        execute: vi.fn(),
        query: {
          sessions: { findFirst: mocks.session },
          sessionPlayers: { findFirst: mocks.player },
        },
        select: () => selection,
        update: () => ({ set: mocks.set }),
        insert: () => ({ values: mocks.insert }),
        delete: mocks.remove,
      });
    },
  },
}));

import { reconcileUnpaidExpenseShares } from "./sync";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.rows.mockReset();
  mocks.session.mockResolvedValue({
    hostId: "host",
    status: "published",
    playerPriceCents: 0,
  });
  mocks.player.mockResolvedValue({ userId: "player" });
  mocks.set.mockReturnValue({ where: vi.fn() });
});

function rows(payments: object[], going = [{ id: "a", userId: "player" }]) {
  mocks.rows
    .mockResolvedValueOnce([{ id: "expense", totalCents: 1000 }])
    .mockResolvedValueOnce(going)
    .mockResolvedValueOnce(payments)
    .mockResolvedValueOnce(
      going.length ? [{ sessionPlayerId: "a", amountCents: 1000 }] : []
    );
}

describe("repayment reconciliation", () => {
  it("creates a share when a player joins a creation collection", async () => {
    rows([]);
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.insert).toHaveBeenCalledWith([
      { expenseId: "expense", sessionPlayerId: "a", amountCents: 1000 },
    ]);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ playerPriceCents: 1000 })
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("keeps collection price pending rather than retaining an old Free fallback", async () => {
    rows([], []);
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ playerPriceCents: null })
    );
  });
  it("updates unpaid shares without deleting their durable records", async () => {
    rows([
      {
        id: "payment",
        sessionPlayerId: "a",
        status: "unpaid",
        amountCents: 500,
      },
    ]);
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: 1000 })
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it.each([
    { status: "sent" },
    { status: "confirmed" },
    {
      status: "unpaid",
      proofStoragePath: "existing-proof",
      reviewNote: "Try again",
    },
  ])("preserves submitted and reviewed history: %o", async (history) => {
    rows([
      { id: "payment", sessionPlayerId: "a", amountCents: 500, ...history },
    ]);
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: expect.any(Number) })
    );
    expect(mocks.remove).not.toHaveBeenCalled();
  });
});
