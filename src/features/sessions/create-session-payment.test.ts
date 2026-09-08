import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

const mocks = vi.hoisted(() => ({
  values: vi.fn(),
  source: vi.fn(),
  requireUser: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({
  redirect: (url: string) => {
    throw new Error(`redirect:${url}`);
  },
}));
vi.mock("@/features/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/features/players/profile", () => ({
  ensureProfile: async () => ({ name: "Host", skillLevel: null }),
}));
vi.mock("@/features/analytics/events", () => ({
  trackSessionMilestone: vi.fn(),
}));
vi.mock("@/features/payments/sync", () => ({
  reconcileUnpaidExpenseShares: vi.fn(),
}));
vi.mock("@/lib/rate-limit", () => ({
  checkRateLimit: async () => ({ allowed: true }),
}));
vi.mock("@/db/client", () => ({
  db: {
    query: { sessions: { findFirst: mocks.source } },
    select: () => ({ from: () => ({ where: async () => [] }) }),
    transaction: async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        insert: (table: unknown) => ({
          values: (values: Record<string, unknown>) => {
            mocks.values(table, values);
            return { returning: async () => [{ id: "new-game", ...values }] };
          },
        }),
      }),
  },
}));

import { expenses, paymentAccounts, sessions } from "@/db/schema";
import { createSessionAction } from "./actions";

function form(choice: string) {
  const data = new FormData();
  for (const [key, value] of Object.entries({
    title: "Saturday pickle",
    venue: "Central court",
    date: new Date(Date.now() + 86_400_000 * 2).toISOString().slice(0, 10),
    start: "19:00",
    end: "21:00",
    capacity: "8",
    courts: "2",
    visibility: "public",
    costKind: choice,
  }))
    data.set(key, value);
  return data;
}

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireUser.mockResolvedValue({ id: "host" });
});

describe("creation payment intent", () => {
  it.each(["collect", "free", "unspecified"])(
    "publishes %s without creating payment records",
    async (choice) => {
      const data = form(choice);
      // Caller-supplied price fields never establish a collection or an obligation.
      data.set("cost", "300");
      data.set("playerPriceCents", "30000");
      await expect(createSessionAction({}, data)).rejects.toThrow("redirect:");
      expect(mocks.values).toHaveBeenCalledWith(
        sessions,
        expect.objectContaining({
          paymentCollectionRequested: choice === "collect",
          playerPriceCents: choice === "free" ? 0 : undefined,
        })
      );
      expect(
        mocks.values.mock.calls.some(
          ([table]) => table === expenses || table === paymentAccounts
        )
      ).toBe(false);
    }
  );
  it("rejects invalid choices before writing", async () => {
    expect(await createSessionAction({}, form("paid"))).toHaveProperty(
      "fieldErrors.costKind"
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("preserves a complete legacy browser draft atomically", async () => {
    const data = form("collect");
    for (const [key, value] of Object.entries({
      label: "Court",
      total: "1200",
      method: "Maya",
      details: "Host account",
      contributionMode: "fixed",
      fixedRate: "300",
    }))
      data.set(key, value);
    await expect(createSessionAction({}, data)).rejects.toThrow("redirect:");
    expect(mocks.values).toHaveBeenCalledWith(
      paymentAccounts,
      expect.objectContaining({ method: "Maya", details: "Host account" })
    );
    expect(mocks.values).toHaveBeenCalledWith(
      expenses,
      expect.objectContaining({ totalCents: 120000, fixedRateCents: 30000 })
    );
  });
  it("does not silently discard an incomplete older setup", async () => {
    const data = form("collect");
    data.set("details", "Saved account");
    expect(await createSessionAction({}, data)).toHaveProperty(
      "fieldErrors.costKind"
    );
    expect(mocks.values).not.toHaveBeenCalled();
  });
  it("does not copy payment setup or collection intent when playing again", async () => {
    mocks.source.mockResolvedValue({
      id: "old-game",
      hostId: "host",
      status: "completed",
      paymentCollectionRequested: true,
      playerPriceCents: 30000,
    });
    const data = form("unspecified");
    data.set("sourceSessionId", "old-game");
    await expect(createSessionAction({}, data)).rejects.toThrow("redirect:");
    expect(mocks.values).toHaveBeenCalledWith(
      sessions,
      expect.objectContaining({
        paymentCollectionRequested: false,
        playerPriceCents: undefined,
      })
    );
    expect(
      mocks.values.mock.calls.some(
        ([table]) => table === expenses || table === paymentAccounts
      )
    ).toBe(false);
  });
});
