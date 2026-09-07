import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  player: vi.fn(),
  expense: vi.fn(),
  payment: vi.fn(),
  insert: vi.fn(),
  user: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("./sync", () => ({ refreshPlayerPriceInTransaction: mocks.refresh }));
vi.mock("@/db/client", () => ({
  db: {
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: vi.fn(),
        query: {
          sessions: { findFirst: mocks.session },
          sessionPlayers: { findFirst: mocks.player },
          expenses: { findFirst: mocks.expense },
          playerPayments: { findFirst: mocks.payment },
        },
        insert: () => ({ values: mocks.insert }),
      }),
  },
}));

import { assignPlayerShare } from "./assign-share-action";

const sessionId = "9e5bb6c8-5f2e-4e1b-927e-dced672dfdd3";
const expenseId = "bc10c0a8-eb33-4e80-87f9-1ca68c94c781";
const playerId = "3483245b-21a8-4210-a757-77a5ef47a689";
function form(amount = "300") {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    sessionId,
    expenseId,
    sessionPlayerId: playerId,
    amount,
    reason: "Late arrival",
  }))
    data.set(key, value);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "host" });
  mocks.session.mockResolvedValue({
    id: sessionId,
    slug: "game",
    hostId: "host",
    status: "published",
  });
  mocks.player.mockResolvedValue({
    id: playerId,
    userId: "player",
    role: "player",
    rsvp: "going",
    leftAt: null,
  });
  mocks.expense.mockResolvedValue({ id: expenseId });
  mocks.payment.mockResolvedValue(null);
});

describe("assigning missing shares", () => {
  it("asks a player to agree before assigning a new charge", async () => {
    expect(await assignPlayerShare({}, form())).toEqual({ success: true });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        expenseId,
        sessionPlayerId: playerId,
        amountCents: 0,
        amountSource: "manual",
        pendingAdjustment: expect.objectContaining({
          previousCents: 0,
          amountCents: 30000,
          reason: "Late arrival",
        }),
      })
    );
  });
  it("records a waiver without billing or redistributing to others", async () => {
    expect(await assignPlayerShare({}, form("0"))).toEqual({ success: true });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 0,
        amountSource: "manual",
        pendingAdjustment: null,
      })
    );
  });
  it("rejects duplicate shares", async () => {
    mocks.payment.mockResolvedValue({ id: "existing" });
    expect(await assignPlayerShare({}, form())).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it.each(["cancelled"])("rejects %s games under lock", async (status) => {
    mocks.session.mockResolvedValue({ id: sessionId, hostId: "host", status });
    expect(await assignPlayerShare({}, form())).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects ordinary players", async () => {
    mocks.user.mockResolvedValue({ id: "player" });
    expect(await assignPlayerShare({}, form())).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("keeps the host excluded", async () => {
    mocks.player.mockResolvedValue({
      id: playerId,
      userId: "host",
      rsvp: "going",
    });
    expect(await assignPlayerShare({}, form())).toHaveProperty("error");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
