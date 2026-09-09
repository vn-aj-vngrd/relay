import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  reserve: vi.fn(),
  upload: vi.fn(),
  remove: vi.fn(),
  reservation: vi.fn(),
  session: vi.fn(),
  persist: vi.fn(),
  update: vi.fn(),
}));
vi.mock("server-only", () => ({}));
vi.mock("./usage", () => ({ reserveMedia: mocks.reserve }));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    storage: { from: () => ({ upload: mocks.upload, remove: mocks.remove }) },
  }),
}));
vi.mock("@/db/client", async () => {
  const { billingMedia } = await import("@/db/schema");
  return {
    db: {
      transaction: async (work: (tx: unknown) => Promise<unknown>) =>
        work({
          select: () => ({
            from: (table: unknown) => ({
              where: () => ({
                for: table === billingMedia ? mocks.reservation : mocks.session,
              }),
            }),
          }),
          update: () => ({
            set: (values: unknown) => {
              mocks.update(values);
              return { where: vi.fn() };
            },
          }),
        }),
    },
  };
});

import { storeGameMedia } from "./media";

const input = {
  hostId: "host",
  sessionId: "game",
  actorKey: "user:player",
  kind: "chat" as const,
  path: "game/photo.png",
  file: new File(["image"], "photo.png", { type: "image/png" }),
};
beforeEach(() => {
  vi.resetAllMocks();
  mocks.reserve.mockResolvedValue({ id: "reservation", bucket: "chat-images" });
  mocks.reservation.mockResolvedValue([{ status: "reserved" }]);
  mocks.upload.mockResolvedValue({ error: null });
  mocks.remove.mockResolvedValue({ error: null });
  mocks.session.mockResolvedValue([
    { hostId: "host", status: "published", participantImagesEnabled: true },
  ]);
});

describe("host-owned media storage", () => {
  it("does not upload when the quota reservation fails", async () => {
    mocks.reserve.mockRejectedValue(new Error("Storage full"));
    await expect(storeGameMedia(input, mocks.persist)).rejects.toThrow(
      "Storage full"
    );
    expect(mocks.upload).not.toHaveBeenCalled();
  });
  it("reserves exact bytes and persists media before marking it stored", async () => {
    await storeGameMedia(input, mocks.persist);
    expect(mocks.reserve).toHaveBeenCalledWith(
      expect.objectContaining({
        hostId: "host",
        actorKey: "user:player",
        bytes: input.file.size,
      })
    );
    expect(mocks.persist).toHaveBeenCalledOnce();
    expect(mocks.update).toHaveBeenCalledWith({
      status: "stored",
      storedAt: expect.any(Date),
    });
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("releases failed uploads only after confirmed cleanup", async () => {
    mocks.upload.mockResolvedValue({ error: { message: "Offline" } });
    await expect(storeGameMedia(input, mocks.persist)).rejects.toThrow(
      "could not be uploaded"
    );
    expect(mocks.remove).toHaveBeenCalledWith([input.path]);
    expect(mocks.update).toHaveBeenCalledWith({ status: "released" });
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("retains reserved bytes when cleanup fails", async () => {
    mocks.persist.mockRejectedValue(new Error("Database failed"));
    mocks.remove.mockResolvedValue({ error: { message: "Unavailable" } });
    await expect(storeGameMedia(input, mocks.persist)).rejects.toThrow(
      "Database failed"
    );
    expect(mocks.update).not.toHaveBeenCalled();
  });
  it("rechecks host permission under the session lock", async () => {
    mocks.session.mockResolvedValue([
      { hostId: "host", status: "published", participantImagesEnabled: false },
    ]);
    await expect(storeGameMedia(input, mocks.persist)).rejects.toThrow(
      "turned off"
    );
    expect(mocks.persist).not.toHaveBeenCalled();
    expect(mocks.update).toHaveBeenCalledWith({ status: "released" });
  });
  it("cleans up if the session was deleted during upload", async () => {
    mocks.session.mockResolvedValue([]);
    await expect(storeGameMedia(input, mocks.persist)).rejects.toThrow(
      "no longer accepting"
    );
    expect(mocks.persist).not.toHaveBeenCalled();
  });
  it("does not delete a successfully committed upload after a lost response", async () => {
    mocks.persist.mockRejectedValue(new Error("Connection lost after commit"));
    mocks.reservation
      .mockResolvedValueOnce([{ status: "reserved" }])
      .mockResolvedValueOnce([{ status: "stored" }]);
    await expect(storeGameMedia(input, mocks.persist)).resolves.toBeUndefined();
    expect(mocks.remove).not.toHaveBeenCalled();
  });
  it("cannot finalize a reservation an admin already cleaned up", async () => {
    mocks.reservation.mockResolvedValue([{ status: "released" }]);
    await expect(storeGameMedia(input, mocks.persist)).rejects.toThrow(
      "reservation has expired"
    );
    expect(mocks.persist).not.toHaveBeenCalled();
  });
});
