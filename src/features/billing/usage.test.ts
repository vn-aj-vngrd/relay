import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db: {} }));

import { billingGameUsage, billingMedia } from "@/db/schema";
import { type BillingTransaction, checkGameCreation } from "./usage";

let events: string[];
let gamesUsed: number;
let previousId: string | null;
let term: {
  startsAt: Date;
  endsAt: Date;
  usageStartsAt: Date;
  games: number;
  storageBytes: number;
} | null;
const writes = vi.fn();
function transaction() {
  return {
    execute: async () => {
      events.push("lock");
    },
    query: {
      billingGameUsage: {
        findFirst: async () => {
          events.push("idempotency");
          return previousId ? { sessionId: previousId } : null;
        },
      },
      billingTerms: { findFirst: async () => term },
      billingOverrides: { findFirst: async () => null },
    },
    select: () => ({
      from: (table: unknown) => ({
        where: async () => {
          events.push("usage");
          if (table === billingGameUsage) return [{ count: gamesUsed }];
          if (table === billingMedia) return [{ bytes: "0" }];
          return [];
        },
      }),
    }),
    insert: writes,
  } as unknown as BillingTransaction;
}
beforeEach(() => {
  events = [];
  gamesUsed = 0;
  previousId = null;
  term = null;
  vi.clearAllMocks();
});

describe("atomic game allowance boundary", () => {
  it("locks before reading idempotency and usage", async () => {
    expect(await checkGameCreation(transaction(), "user", "key")).toMatchObject(
      { existingSessionId: null, createdAt: expect.any(Date) }
    );
    expect(events.slice(0, 2)).toEqual(["lock", "idempotency"]);
  });
  it("permits a fifth Free game but rejects a sixth", async () => {
    gamesUsed = 4;
    expect(
      await checkGameCreation(transaction(), "user", "key")
    ).toHaveProperty("existingSessionId", null);
    gamesUsed = 5;
    await expect(
      checkGameCreation(transaction(), "user", "key")
    ).rejects.toThrow("5 of 5 games");
  });
  it("returns an already-created game even when the allowance is exhausted", async () => {
    gamesUsed = 5;
    previousId = "existing-game";
    expect(
      await checkGameCreation(transaction(), "user", "same-key")
    ).toHaveProperty("existingSessionId", "existing-game");
    expect(events).toEqual(["lock", "idempotency"]);
  });
  it("does not spend usage during checking; the creation transaction owns the ledger write", async () => {
    await checkGameCreation(transaction(), "user", "key");
    expect(writes).not.toHaveBeenCalled();
  });
  it("allows up to thirty games for an active Pro term", async () => {
    const now = new Date();
    term = {
      startsAt: new Date(now.getTime() - 1000),
      endsAt: new Date(now.getTime() + 86400_000),
      usageStartsAt: new Date(now.getTime() - 1000),
      games: 30,
      storageBytes: 2147483648,
    };
    gamesUsed = 29;
    expect(
      await checkGameCreation(transaction(), "user", "key")
    ).toHaveProperty("existingSessionId", null);
    gamesUsed = 30;
    await expect(
      checkGameCreation(transaction(), "user", "key")
    ).rejects.toThrow("30 of 30 games");
  });
});
