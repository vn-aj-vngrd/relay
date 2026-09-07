import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  lookup: vi.fn(),
  payment: vi.fn(),
  session: vi.fn(),
  viewer: vi.fn(),
  set: vi.fn(),
  insert: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/features/sessions/viewer", () => ({
  getSessionViewer: mocks.viewer,
}));
vi.mock("@/lib/rate-limit", () => ({ assertRateLimit: vi.fn() }));
vi.mock("./sync", () => ({ refreshPlayerPriceInTransaction: mocks.refresh }));
vi.mock("@/db/client", () => ({
  db: {
    select: () => {
      const query = {
        from: () => query,
        innerJoin: () => query,
        where: mocks.lookup,
      };
      return query;
    },
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: vi.fn(),
        query: {
          sessions: { findFirst: mocks.session },
          playerPayments: { findFirst: mocks.payment },
        },
        update: () => ({ set: mocks.set }),
        insert: () => ({ values: mocks.insert }),
      }),
  },
}));

import { respondToPaymentAdjustment } from "./adjustment-actions";

const proposal = {
  id: "ae015227-0c53-455a-85a7-eb7e07d37909",
  amountCents: 35000,
  previousCents: 30000,
  reason: "Extra court time",
  proposedBy: "host",
};
const payment = {
  id: "c34f4a8c-9f8e-42aa-84a7-741de48d2a97",
  sessionPlayerId: "player",
  amountCents: 30000,
  amountSource: "automatic",
  status: "unpaid",
  pendingAdjustment: proposal,
  adjustmentHistory: [],
};
const session = {
  id: "game",
  slug: "game-link",
  hostId: "host",
  status: "published",
};
function form(decision = "accept") {
  const data = new FormData();
  data.set("paymentId", payment.id);
  data.set("proposalId", proposal.id);
  data.set("decision", decision);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.lookup.mockResolvedValue([{ payment, session }]);
  mocks.payment.mockResolvedValue(payment);
  mocks.session.mockResolvedValue(session);
  mocks.viewer.mockResolvedValue({ player: { id: "player" }, isGuest: true });
  mocks.set.mockReturnValue({ where: vi.fn() });
});

describe("player agreement to payment changes", () => {
  it("applies only the proposed amount and persists the player's agreement", async () => {
    expect(await respondToPaymentAdjustment({}, form())).toEqual({
      success: true,
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 35000,
        amountSource: "manual",
        pendingAdjustment: null,
        adjustmentHistory: [
          expect.objectContaining({
            previousCents: 30000,
            amountCents: 35000,
            decision: "accepted",
            changedBy: "player",
          }),
        ],
      })
    );
    expect(mocks.refresh).toHaveBeenCalled();
  });
  it("keeps a declined amount as a durable override, not a future automatic charge", async () => {
    expect(await respondToPaymentAdjustment({}, form("decline"))).toEqual({
      success: true,
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({
        amountCents: 30000,
        amountSource: "manual",
        pendingAdjustment: null,
        adjustmentHistory: [expect.objectContaining({ decision: "declined" })],
      })
    );
  });
  it("rejects other players and organizer impersonation", async () => {
    mocks.viewer.mockResolvedValue({ player: { id: "host" } });
    expect(await respondToPaymentAdjustment({}, form())).toHaveProperty(
      "error"
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it.each([
    { pendingAdjustment: null },
    { pendingAdjustment: { ...proposal, id: "old-proposal" } },
    { amountCents: 29000 },
    { status: "confirmed" },
    { status: "sent" },
    { status: "excluded" },
    { proofStoragePath: "proof", reviewNote: "Resend" },
  ])("rejects stale, reviewed or repeated responses: %o", async (changes) => {
    mocks.payment.mockResolvedValue({ ...payment, ...changes });
    expect(await respondToPaymentAdjustment({}, form())).toHaveProperty(
      "error"
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("rechecks cancellation under the session lock", async () => {
    mocks.session.mockResolvedValue({ ...session, status: "cancelled" });
    expect(await respondToPaymentAdjustment({}, form())).toHaveProperty(
      "error"
    );
    expect(mocks.set).not.toHaveBeenCalled();
  });
});
