import type { SQL } from "drizzle-orm";
import { PgDialect } from "drizzle-orm/pg-core";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  lock: vi.fn(),
  allowance: vi.fn(),
  transaction: vi.fn(),
  previous: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
  selection: vi.fn(),
  used: 0,
  reserved: 0,
}));
vi.mock("@/features/billing/usage", () => ({
  getAccountAllowance: mocks.allowance,
  lockBillingAccount: mocks.lock,
}));
vi.mock("@/db/client", () => ({
  db: { transaction: mocks.transaction, update: () => ({ set: mocks.update }) },
}));

import { defaultAgentLimits } from "./allowance";
import {
  AgentDuplicateRequestError,
  AgentQuotaError,
  chargeAgentMessage,
  reserveAgentMessage,
} from "./usage";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.used = 0;
  mocks.reserved = 0;
  mocks.allowance.mockResolvedValue({
    plan: "free",
    start: new Date("2026-09-01"),
    end: new Date("2026-10-01"),
  });
  mocks.previous.mockResolvedValue(null);
  mocks.transaction.mockImplementation(
    async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        query: { agentMessageUsage: { findFirst: mocks.previous } },
        select: (selection: unknown) => {
          mocks.selection(selection);
          return {
            from: () => ({
              where: async () => [
                { used: mocks.used, reserved: mocks.reserved },
              ],
            }),
          };
        },
        insert: () => ({ values: mocks.insert }),
      })
  );
});
describe("Agent allowance reservation", () => {
  it("encodes the reservation clock as a string for the database driver", async () => {
    await reserveAgentMessage("user", "request", defaultAgentLimits);
    const selection = mocks.selection.mock.calls[0][0] as { reserved: SQL };
    const query = new PgDialect().sqlToQuery(selection.reserved);
    expect(query.params).toHaveLength(1);
    expect(query.params[0]).toEqual(
      expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
    );
    expect(query.params[0]).not.toBeInstanceOf(Date);
  });
  it("locks the billing account before checking capacity and reserving", async () => {
    await reserveAgentMessage("user", "request", defaultAgentLimits);
    expect(mocks.lock).toHaveBeenCalledWith(expect.any(Object), "user");
    expect(mocks.lock.mock.invocationCallOrder[0]).toBeLessThan(
      mocks.allowance.mock.invocationCallOrder[0]
    );
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: "user",
        id: "request",
        status: "reserved",
      })
    );
  });
  it("rejects a concurrent claim when the last message is already reserved", async () => {
    mocks.used = 49;
    mocks.reserved = 1;
    await expect(
      reserveAgentMessage("user", "request", defaultAgentLimits)
    ).rejects.toBeInstanceOf(AgentQuotaError);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("rejects replays without charging or inserting again", async () => {
    mocks.previous.mockResolvedValue({ id: "request", status: "charged" });
    await expect(
      reserveAgentMessage("user", "request", defaultAgentLimits)
    ).rejects.toBeInstanceOf(AgentDuplicateRequestError);
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("fails closed if a reservation cannot be charged", async () => {
    mocks.update.mockReturnValue({
      where: () => ({ returning: async () => [] }),
    });
    await expect(chargeAgentMessage("user", "expired")).rejects.toThrow(
      "reservation expired"
    );
  });
});
