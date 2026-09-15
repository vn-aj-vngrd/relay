import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  bytes: 0,
  chatImageMaxMiB: 1,
  memoryImageMaxMiB: 2,
  uploads: 0,
  photoCount: 0,
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
      billingSettings: {
        findFirst: async () => ({
          chatImageMaxMiB: mocks.chatImageMaxMiB,
          memoryImageMaxMiB: mocks.memoryImageMaxMiB,
        }),
      },
      billingTerms: { findFirst: async () => null },
      billingOverrides: { findFirst: mocks.override },
    },
    select: (shape: Record<string, unknown>) => ({
      from: (table: unknown) => ({
        where: async () =>
          "photoCount" in shape
            ? [{ photoCount: mocks.photoCount }]
            : "bytes" in shape
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
  mocks.chatImageMaxMiB = 1;
  mocks.memoryImageMaxMiB = 2;
  mocks.uploads = 0;
  mocks.photoCount = 0;
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
    mocks.bytes = 249 * MiB;
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
    mocks.bytes = 249 * MiB + 1;
    await expect(reserveMedia(input)).rejects.toThrow(
      "remaining shared storage"
    );
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

it("reserves the fiftieth album slot but blocks the next photo, independently of storage", async () => {
  const memory = { ...input, kind: "memory" as const };
  mocks.photoCount = 49;
  await expect(reserveMedia(memory)).resolves.toHaveProperty("id");
  mocks.photoCount = 50;
  mocks.insert.mockClear();
  await expect(reserveMedia(memory)).rejects.toThrow("50-photo limit");
  expect(mocks.insert).not.toHaveBeenCalled();
});

it("blocks an album with room when the shared storage is exhausted", async () => {
  mocks.photoCount = 30;
  mocks.bytes = 250 * MiB;
  await expect(reserveMedia({ ...input, kind: "memory" })).rejects.toThrow(
    "remaining shared storage"
  );
  expect(mocks.insert).not.toHaveBeenCalled();
});

it("lets one contributor fill an album without a per-player album cap", async () => {
  mocks.photoCount = 49;
  mocks.uploads = 49;
  await expect(
    reserveMedia({ ...input, kind: "memory" })
  ).resolves.toHaveProperty("id");
});

it("retains the album ceiling even when the host has Unlimited storage", async () => {
  mocks.override.mockResolvedValue({
    planOverride: defaultBillingPlans.find((plan) => plan.id === "unlimited"),
    games: null,
    storageBytes: null,
    expiresAt: null,
  });
  mocks.photoCount = 50;
  await expect(reserveMedia({ ...input, kind: "memory" })).rejects.toThrow(
    "50-photo limit"
  );
});

it("enforces the latest admin chat limit at the reservation boundary", async () => {
  mocks.chatImageMaxMiB = 3;
  await expect(
    reserveMedia({ ...input, bytes: 3 * MiB })
  ).resolves.toHaveProperty("id");
  await expect(reserveMedia({ ...input, bytes: 3 * MiB + 1 })).rejects.toThrow(
    "smaller image"
  );
  mocks.chatImageMaxMiB = 1;
  mocks.memoryImageMaxMiB = 2;
  await expect(reserveMedia({ ...input, bytes: 2 * MiB })).rejects.toThrow(
    "smaller image"
  );
});

it("keeps album photos at 2 MiB when the chat limit increases", async () => {
  mocks.chatImageMaxMiB = 4;
  await expect(
    reserveMedia({ ...input, kind: "memory", bytes: 2 * MiB + 1 })
  ).rejects.toThrow("smaller image");
});

it("enforces the independent album setting including exact boundaries", async () => {
  mocks.memoryImageMaxMiB = 4;
  await expect(
    reserveMedia({ ...input, kind: "memory", bytes: 4 * MiB })
  ).resolves.toHaveProperty("id");
  await expect(
    reserveMedia({ ...input, kind: "memory", bytes: 4 * MiB + 1 })
  ).rejects.toThrow("smaller image");
  mocks.memoryImageMaxMiB = 1;
  await expect(
    reserveMedia({ ...input, kind: "memory", bytes: MiB + 1 })
  ).rejects.toThrow("smaller image");
});
