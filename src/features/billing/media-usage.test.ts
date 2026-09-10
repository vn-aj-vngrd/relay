import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bytes: 0,
  uploads: 0,
  insert: vi.fn(),
  lock: vi.fn(),
  override: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("@/db/client", async () => {
  const { billingMedia } = await import("@/db/schema");
  const tx = {
    execute: mocks.lock,
    query: {
      billingSettings: { findFirst: async () => null },
      billingTerms: { findFirst: async () => null },
      billingOverrides: { findFirst: mocks.override },
    },
    select: (shape: Record<string, unknown>) => ({
      from: (table: unknown) => ({
        where: async () =>
          "bytes" in shape
            ? [{ bytes: String(mocks.bytes) }]
            : [{ count: table === billingMedia ? mocks.uploads : 0 }],
      }),
    }),
    insert: () => ({
      values: (values: unknown) => {
        mocks.insert(values);
        return {
          returning: async () => [
            { id: "reservation", ...(values as Record<string, unknown>) },
          ],
        };
      },
    }),
  };
  return {
    db: {
      transaction: (work: (connection: typeof tx) => Promise<unknown>) =>
        work(tx),
    },
  };
});

import { defaultBillingPlans, MiB } from "./domain";
import { reserveMedia } from "./usage";

const input = {
  hostId: "host",
  sessionId: "game",
  actorKey: "user:uploader",
  kind: "chat" as const,
  path: "game/photo.jpg",
  bytes: MiB,
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.bytes = 0;
  mocks.uploads = 0;
  mocks.override.mockResolvedValue(null);
});

describe("media reservation allowance", () => {
  it("removes retained-storage quotas for Unlimited without bypassing upload safeguards", async () => {
    mocks.override.mockResolvedValue({
      planOverride: defaultBillingPlans.find(
        (plan) => plan.id === "unlimited"
      )!,
      games: null,
      storageBytes: null,
      expiresAt: null,
    });
    mocks.bytes = 100 * 1024 * MiB;
    await expect(reserveMedia(input)).resolves.toHaveProperty("id");
    mocks.uploads = 10;
    await expect(reserveMedia(input)).rejects.toThrow("10 chat images today");
    await expect(reserveMedia({ ...input, bytes: MiB + 1 })).rejects.toThrow(
      "smaller image"
    );
  });
  it("accepts the exact remaining Free storage capacity", async () => {
    mocks.bytes = 99 * MiB;
    await expect(reserveMedia(input)).resolves.toHaveProperty(
      "id",
      "reservation"
    );
    expect(mocks.lock).toHaveBeenCalledTimes(2);
    expect(mocks.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        bytes: MiB,
        hostId: "host",
        actorKey: "user:uploader",
        bucket: "chat-images",
      })
    );
  });
  it("rejects even a one-byte storage overage before reserving", async () => {
    mocks.bytes = 99 * MiB + 1;
    await expect(reserveMedia(input)).rejects.toThrow("host has reached");
    expect(mocks.insert).not.toHaveBeenCalled();
  });
  it("allows the tenth image but not the eleventh for an uploader", async () => {
    mocks.uploads = 9;
    await reserveMedia(input);
    mocks.uploads = 10;
    await expect(reserveMedia(input)).rejects.toThrow("10 chat images today");
  });
  it("applies a host storage override independently of daily uploader limits", async () => {
    mocks.bytes = 100 * MiB;
    mocks.override.mockResolvedValue({
      games: null,
      storageBytes: 200 * MiB,
      expiresAt: null,
    });
    await expect(reserveMedia(input)).resolves.toHaveProperty("id");
    mocks.uploads = 10;
    await expect(reserveMedia(input)).rejects.toThrow("chat images today");
  });
  it("rejects invalid and oversized files before database access", async () => {
    for (const bytes of [0, -1, MiB + 1, Number.NaN])
      await expect(reserveMedia({ ...input, bytes })).rejects.toThrow(
        "smaller image"
      );
    expect(mocks.lock).not.toHaveBeenCalled();
  });
});
