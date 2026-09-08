import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  record: vi.fn(),
  snapshot: vi.fn(),
  update: vi.fn(),
  insert: vi.fn(),
  execute: vi.fn(),
  user: vi.fn(),
  collectionRows: vi.fn(),
  playerRows: vi.fn(),
  paymentRows: vi.fn(),
  lookup: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/features/sessions/viewer", () => ({ getSessionViewer: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn(),
  checkRateLimit: async () => ({ allowed: true }),
}));
vi.mock("./sync", () => ({
  reconcileExpenseSharesInTransaction: vi.fn(),
  refreshPlayerPriceInTransaction: vi.fn(),
}));
vi.mock("./payment-revision", async (original) => ({
  ...(await original<typeof import("./payment-revision")>()),
  paymentSnapshot: mocks.snapshot,
}));
vi.mock("@/db/client", () => ({
  db: {
    select: () => {
      const query = {
        from: () => query,
        innerJoin: () => query,
        where: () => query,
        limit: mocks.lookup,
      };
      return query;
    },
    query: { sessions: { findFirst: mocks.session } },
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: mocks.execute,
        query: {
          sessions: { findFirst: mocks.session },
          expenses: { findFirst: mocks.record },
        },
        update: (table: unknown) => ({
          set: (values: unknown) => {
            mocks.update(table, values);
            return { where: vi.fn() };
          },
        }),
        insert: (table: unknown) => ({
          values: (values: Record<string, unknown>) => {
            mocks.insert(table, values);
            return {
              returning: async () => [
                {
                  id: table === expenses ? "new-collection" : "new-account",
                  ...values,
                },
              ],
            };
          },
        }),
        select: () => ({
          from: (table: unknown) => {
            const query = {
              innerJoin: () => query,
              where: () =>
                table === expenses
                  ? mocks.collectionRows()
                  : table === playerPayments
                    ? mocks.paymentRows()
                    : mocks.playerRows(),
            };
            return query;
          },
        }),
      }),
  },
}));

import { expenses, notifications, playerPayments, sessions } from "@/db/schema";
import {
  createExpenseState,
  markPaymentSent,
  updatePaymentChoiceState,
} from "./actions";
import { paymentRevision } from "./payment-revision";
import { expenseFixture, paymentFixture } from "./test-fixtures";

const session = {
  id: "3f06bfc0-ec28-42e8-a8dd-82e69f724407",
  slug: "game",
  hostId: "host",
  status: "published",
  version: 4,
  playerPriceCents: 30000,
  paymentCollectionRequested: true,
};
const collection = expenseFixture({ id: "collection" });
const proposal = {
  id: "proposal",
  amountCents: 40000,
  previousCents: 30000,
  reason: "Extra court time",
  proposedBy: "host",
};
const payments = [
  paymentFixture({
    id: "unpaid",
    expenseId: "collection",
    sessionPlayerId: "p1",
    amountCents: 30000,
    status: "unpaid",
    pendingAdjustment: proposal,
    adjustmentHistory: [],
  }),
  paymentFixture({
    id: "paid",
    expenseId: "collection",
    sessionPlayerId: "p2",
    amountCents: 30000,
    status: "confirmed",
    pendingAdjustment: null,
    adjustmentHistory: [],
    proofStoragePath: "proof.png",
  }),
];
const snapshot = { collections: [collection], payments };

function form(choice = "free") {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("costKind", choice);
  data.set(
    "paymentRevision",
    paymentRevision(session, snapshot.collections, snapshot.payments)
  );
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "host" });
  mocks.session.mockResolvedValue(session);
  mocks.record.mockResolvedValue(collection);
  mocks.snapshot.mockResolvedValue(snapshot);
  mocks.collectionRows.mockResolvedValue([]);
  mocks.paymentRows.mockResolvedValue([]);
  mocks.playerRows.mockResolvedValue([
    { id: "p1", userId: "player", leftAt: null },
    { id: "p2", userId: "left-player", leftAt: new Date() },
  ]);
});

describe("confirmed payment switching", () => {
  it("rejects proof on archived requests before uploading or writing", async () => {
    mocks.lookup.mockResolvedValue([{ expense: { archivedAt: new Date() } }]);
    const data = new FormData();
    data.set("paymentId", session.id);
    expect(await markPaymentSent({}, data)).toHaveProperty(
      "error",
      expect.stringContaining("collection is closed")
    );
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("starts a separate collection and asks existing players to agree after Free", async () => {
    const free = { ...session, playerPriceCents: 0, version: 5 };
    const history = {
      ...snapshot,
      collections: [{ ...collection, archivedAt: new Date("2030-01-01") }],
    };
    mocks.session.mockResolvedValue(free);
    mocks.snapshot.mockResolvedValue(history);
    mocks.playerRows.mockResolvedValue([
      { id: "p1", userId: "player", leftAt: null },
    ]);
    const data = form("collect");
    data.set(
      "paymentRevision",
      paymentRevision(free, history.collections, history.payments)
    );
    for (const [key, value] of Object.entries({
      label: "Court",
      total: "1200",
      method: "Maya",
      details: "New instructions",
      contributionMode: "fixed",
      fixedRate: "300",
    }))
      data.set(key, value);
    expect(await createExpenseState({}, data)).toEqual({ success: true });
    expect(mocks.insert).toHaveBeenCalledWith(playerPayments, [
      expect.objectContaining({
        expenseId: "new-collection",
        sessionPlayerId: "p1",
        amountCents: 0,
        pendingAdjustment: expect.objectContaining({
          previousCents: 0,
          amountCents: 30000,
        }),
      }),
    ]);
    expect(
      mocks.update.mock.calls.some(
        ([table]) => table === expenses || table === playerPayments
      )
    ).toBe(false);
    expect(mocks.update).toHaveBeenCalledWith(
      sessions,
      expect.objectContaining({ playerPriceCents: 30000 })
    );
  });
  it("archives collections, cancels proposals, retains paid records, and notifies affected players", async () => {
    expect(await updatePaymentChoiceState({}, form())).toEqual({
      success: true,
    });
    expect(mocks.update).toHaveBeenCalledWith(
      expenses,
      expect.objectContaining({
        archivedAt: expect.any(Date),
        archivedById: "host",
      })
    );
    expect(mocks.update).toHaveBeenCalledWith(
      playerPayments,
      expect.objectContaining({
        pendingAdjustment: null,
        adjustmentHistory: [
          expect.objectContaining({
            decision: "cancelled",
            previousCents: 30000,
            amountCents: 40000,
          }),
        ],
      })
    );
    const paymentWrites = mocks.update.mock.calls.filter(
      ([table]) => table === playerPayments
    );
    expect(paymentWrites).toHaveLength(1);
    expect(paymentWrites[0][1]).not.toHaveProperty("amountCents");
    expect(paymentWrites[0][1]).not.toHaveProperty("proofStoragePath");
    expect(mocks.update).toHaveBeenCalledWith(
      sessions,
      expect.objectContaining({
        playerPriceCents: 0,
        paymentCollectionRequested: false,
      })
    );
    expect(mocks.insert).toHaveBeenCalledWith(
      notifications,
      expect.arrayContaining([
        expect.objectContaining({
          userId: "player",
          type: "session_cost_changed",
        }),
        expect.objectContaining({
          userId: "left-player",
          type: "session_cost_changed",
        }),
      ])
    );
  });
  it("requires a fresh confirmation when proof or price changed", async () => {
    mocks.snapshot.mockResolvedValue({
      ...snapshot,
      payments: [{ ...payments[0], status: "sent" }, payments[1]],
    });
    expect(await updatePaymentChoiceState({}, form())).toHaveProperty(
      "error",
      expect.stringContaining("Payments changed")
    );
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("does not repeat notifications for an already completed switch", async () => {
    mocks.session.mockResolvedValue({
      ...session,
      version: 5,
      playerPriceCents: 0,
      paymentCollectionRequested: false,
    });
    mocks.snapshot.mockResolvedValue({
      ...snapshot,
      collections: [{ ...collection, archivedAt: new Date() }],
    });
    expect(await updatePaymentChoiceState({}, form())).toEqual({
      success: true,
    });
    expect(mocks.update).not.toHaveBeenCalled();
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("requires confirmation even if all current shares have already been waived", async () => {
    const freePriceSession = { ...session, playerPriceCents: 0 };
    mocks.session.mockResolvedValue(freePriceSession);
    const data = form();
    data.set(
      "paymentRevision",
      paymentRevision(freePriceSession, snapshot.collections, snapshot.payments)
    );
    expect(await updatePaymentChoiceState({}, data)).toEqual({ success: true });
    expect(mocks.update).toHaveBeenCalledWith(
      expenses,
      expect.objectContaining({ archivedAt: expect.any(Date) })
    );
  });
  it.each(["cohost", "player"])("rejects a switch by %s", async (id) => {
    mocks.user.mockResolvedValue({ id });
    expect(await updatePaymentChoiceState({}, form())).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("keeps cancelled games read-only", async () => {
    mocks.session.mockResolvedValue({ ...session, status: "cancelled" });
    expect(await updatePaymentChoiceState({}, form())).toHaveProperty("error");
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("does not allow new collections on completed games", async () => {
    mocks.session.mockResolvedValue({ ...session, status: "completed" });
    const data = form("collect");
    for (const [key, value] of Object.entries({
      label: "Court",
      total: "1200",
      method: "GCash",
      details: "Host account",
    }))
      data.set(key, value);
    expect(await createExpenseState({}, data)).toHaveProperty(
      "error",
      "New collections cannot be started after the game has ended."
    );
    expect(mocks.insert).not.toHaveBeenCalled();
  });
});
