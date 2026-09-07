import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  session: vi.fn(),
  expense: vi.fn(),
  set: vi.fn(),
  user: vi.fn(),
  rows: vi.fn(),
  insert: vi.fn(),
  reconcile: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ unstable_rethrow: vi.fn() }));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.user }));
vi.mock("@/features/sessions/viewer", () => ({ getSessionViewer: vi.fn() }));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));
vi.mock("@/lib/rate-limit", () => ({
  assertRateLimit: vi.fn(),
  checkRateLimit: vi.fn(async () => ({ allowed: true })),
}));
vi.mock("./sync", () => ({
  reconcileExpenseSharesInTransaction: mocks.reconcile,
}));
vi.mock("@/db/client", () => ({
  db: {
    query: { sessions: { findFirst: mocks.session } },
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: vi.fn(),
        query: {
          sessions: { findFirst: mocks.session },
          expenses: { findFirst: mocks.expense },
        },
        update: () => ({ set: mocks.set }),
        insert: () => ({ values: mocks.insert }),
        select: () => ({ from: () => ({ where: mocks.rows }) }),
      }),
  },
}));

import { updateExpenseState, updatePaymentChoiceState } from "./actions";

const session = {
  id: "3f06bfc0-ec28-42e8-a8dd-82e69f724407",
  slug: "game",
  hostId: "host",
  status: "published",
  playerPriceCents: null,
};
function form(choice = "free") {
  const data = new FormData();
  data.set("sessionId", session.id);
  data.set("costKind", choice);
  return data;
}
beforeEach(() => {
  vi.clearAllMocks();
  mocks.user.mockResolvedValue({ id: "host" });
  mocks.session.mockResolvedValue(session);
  mocks.expense.mockResolvedValue(null);
  mocks.set.mockReturnValue({ where: vi.fn() });
  mocks.rows.mockResolvedValue([{ userId: "player", leftAt: null }]);
});

describe("payment choice persistence", () => {
  it("persists explicit zero and notifies players using the price-change pattern", async () => {
    expect(await updatePaymentChoiceState({}, form())).toEqual({
      success: true,
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ playerPriceCents: 0 })
    );
    expect(mocks.insert).toHaveBeenCalledWith([
      expect.objectContaining({
        type: "session_cost_changed",
        userId: "player",
      }),
    ]);
  });
  it("lets the host correct Free to unset even during Play", async () => {
    mocks.session.mockResolvedValue({
      ...session,
      status: "live",
      playerPriceCents: 0,
    });
    expect(await updatePaymentChoiceState({}, form("unspecified"))).toEqual({
      success: true,
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ playerPriceCents: null })
    );
  });
  it.each(["free", "unspecified"])(
    "blocks %s when any collection exists, including one without shares",
    async (choice) => {
      mocks.expense.mockResolvedValue({ id: "collection" });
      expect(await updatePaymentChoiceState({}, form(choice))).toEqual({
        error:
          "This game has payment records. You can edit payment details, but cannot mark it free or unset.",
      });
      expect(mocks.set).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
    }
  );
  it("rechecks ownership inside the session lock", async () => {
    mocks.user.mockResolvedValue({ id: "player" });
    expect(await updatePaymentChoiceState({}, form())).toHaveProperty("error");
    expect(mocks.set).not.toHaveBeenCalled();
  });
  it("keeps cancelled payment records read-only", async () => {
    mocks.session.mockResolvedValue({ ...session, status: "cancelled" });
    expect(await updatePaymentChoiceState({}, form())).toHaveProperty("error");
    expect(mocks.set).not.toHaveBeenCalled();
  });
});

describe("collection total safeguards", () => {
  function expenseForm(total = "3000") {
    const data = form();
    data.set("expenseId", "93cc7e69-556d-4476-b0a8-a66d77ef6a7c");
    data.set("label", "Court");
    data.set("total", total);
    data.set("method", "Maya");
    data.set("details", "Corrected host account");
    return data;
  }

  it.each([
    { status: "sent", amountCents: 120000 },
    { status: "confirmed", amountCents: 120000 },
    { status: "unpaid", amountCents: 120000 },
    { status: "unpaid", amountCents: 50000 },
    { status: "unpaid", amountCents: 0 },
    { status: "excluded", amountCents: 0 },
  ])(
    "rejects a total edit after existing shares, including manual/waived amounts: %o",
    async (payment) => {
      mocks.expense.mockResolvedValue({ totalCents: 240000 });
      mocks.rows.mockResolvedValue([payment]);
      expect(await updateExpenseState({}, expenseForm())).toEqual({
        error:
          "This collection already has player shares. Its total cannot be changed without replacing existing amounts. Payment details and images can still be corrected.",
      });
      expect(mocks.set).not.toHaveBeenCalled();
      expect(mocks.insert).not.toHaveBeenCalled();
      expect(mocks.reconcile).not.toHaveBeenCalled();
    }
  );

  it("allows correcting a total before any shares exist", async () => {
    mocks.expense.mockResolvedValue({ totalCents: 240000 });
    mocks.rows.mockResolvedValue([]);
    mocks.insert.mockReturnValue({
      returning: async () => [{ id: "account" }],
    });
    expect(await updateExpenseState({}, expenseForm())).toEqual({
      success: true,
    });
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ totalCents: 300000 })
    );
    expect(mocks.reconcile).toHaveBeenCalledWith(
      expect.anything(),
      session.id,
      "93cc7e69-556d-4476-b0a8-a66d77ef6a7c"
    );
  });

  it("still corrects payment instructions without resplitting existing waived shares", async () => {
    mocks.expense.mockResolvedValue({ totalCents: 240000 });
    mocks.rows
      .mockResolvedValueOnce([{ status: "unpaid", amountCents: 0 }])
      .mockResolvedValueOnce([]);
    mocks.insert.mockReturnValue({
      returning: async () => [{ id: "account" }],
    });
    expect(await updateExpenseState({}, expenseForm("2400"))).toEqual({
      success: true,
    });
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({ details: "Corrected host account" })
    );
    expect(mocks.reconcile).not.toHaveBeenCalled();
  });
});
