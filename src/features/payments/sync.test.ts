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

function rows(
  payments: object[],
  going: Array<{ id: string; userId: string; createdAt?: Date }> = [
    { id: "a", userId: "player" },
  ],
  collection: object = {}
) {
  mocks.rows
    .mockResolvedValueOnce([
      {
        id: "expense",
        totalCents: 1000,
        contributionMode: "split",
        ...collection,
      },
    ])
    .mockResolvedValueOnce(going)
    .mockResolvedValueOnce(payments)
    .mockResolvedValueOnce(
      going.length ? [{ sessionPlayerId: "a", amountCents: 1000 }] : []
    );
}

describe("repayment reconciliation", () => {
  it("preserves a manual waiver without passing the discount to another player", async () => {
    rows(
      [
        {
          id: "payment",
          sessionPlayerId: "a",
          amountCents: 0,
          status: "unpaid",
          amountSource: "manual",
        },
      ],
      [
        { id: "a", userId: "player" },
        { id: "b", userId: "other" },
      ]
    );
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: expect.any(Number) })
    );
    expect(mocks.insert).toHaveBeenCalledWith([
      {
        expenseId: "expense",
        sessionPlayerId: "b",
        amountCents: 500,
        amountSource: "automatic",
        pendingAdjustment: null,
      },
    ]);
  });
  it("adds a fixed-price late joiner without touching another player's proof", async () => {
    rows(
      [
        {
          id: "payment",
          sessionPlayerId: "a",
          amountCents: 300,
          status: "sent",
          proofStoragePath: "proof",
        },
      ],
      [
        { id: "a", userId: "player" },
        { id: "b", userId: "other" },
      ],
      { contributionMode: "fixed", fixedRateCents: 300 }
    );
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.insert).toHaveBeenCalledWith([
      {
        expenseId: "expense",
        sessionPlayerId: "b",
        amountCents: 300,
        amountSource: "automatic",
        pendingAdjustment: null,
      },
    ]);
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ playerPriceCents: 300 })
    );
    expect(mocks.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: expect.any(Number) })
    );
  });
  it("asks an existing waitlisted player before charging a formerly free game", async () => {
    rows(
      [],
      [{ id: "a", userId: "player", createdAt: new Date("2030-01-01") }],
      {
        contributionMode: "fixed",
        fixedRateCents: 300,
        consentBefore: new Date("2030-01-02"),
        label: "Court",
      }
    );
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        sessionPlayerId: "a",
        amountCents: 0,
        pendingAdjustment: expect.objectContaining({
          amountCents: 300,
          previousCents: 0,
        }),
      }),
    ]);
  });
  it("never guesses whether a legacy amount was a manual override", async () => {
    rows([
      {
        id: "payment",
        sessionPlayerId: "a",
        amountCents: 250,
        status: "unpaid",
        amountSource: "legacy",
      },
    ]);
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: expect.any(Number) })
    );
  });
  it("does not replace a pending proposal while reconciling fixed shares", async () => {
    rows(
      [
        {
          id: "payment",
          sessionPlayerId: "a",
          amountCents: 0,
          status: "unpaid",
          amountSource: "automatic",
          pendingAdjustment: { amountCents: 300 },
        },
      ],
      undefined,
      { contributionMode: "fixed", fixedRateCents: 300 }
    );
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.set).not.toHaveBeenCalledWith(
      expect.objectContaining({ amountCents: expect.any(Number) })
    );
  });
  it("creates a share when a player joins a creation collection", async () => {
    rows([]);
    await reconcileUnpaidExpenseShares("game");
    expect(mocks.insert).toHaveBeenCalledWith([
      {
        expenseId: "expense",
        sessionPlayerId: "a",
        amountCents: 1000,
        amountSource: "automatic",
        pendingAdjustment: null,
      },
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
