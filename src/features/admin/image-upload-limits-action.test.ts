import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  saved: vi.fn(),
  set: vi.fn(),
  audit: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/db/client", () => ({ db: { transaction: mocks.transaction } }));

import { updateImageUploadLimitsAction } from "./image-upload-limits-action";

function form(value: string, album = "2") {
  const data = new FormData();
  data.set("chatImageMaxMiB", value);
  data.set("memoryImageMaxMiB", album);
  return data;
}

beforeEach(() => {
  vi.resetAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "admin" });
  mocks.saved.mockResolvedValue([{ id: "global" }]);
  mocks.set.mockReturnValue({ where: () => ({ returning: mocks.saved }) });
  mocks.transaction.mockImplementation(
    async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        update: () => ({ set: mocks.set }),
        insert: () => ({ values: mocks.audit }),
      })
  );
});

describe("admin chat image limit action", () => {
  it("requires admin access and saves an audited global limit", async () => {
    expect(await updateImageUploadLimitsAction({}, form("3"))).toEqual({
      success: "Photo limits saved: chat 3 MiB, album 2 MiB.",
    });
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.set).toHaveBeenCalledWith(
      expect.objectContaining({ chatImageMaxMiB: 3 })
    );
    expect(mocks.audit).toHaveBeenCalledWith(
      expect.objectContaining({
        actorUserId: "admin",
        action: "uploads.image_limits_updated",
        metadata: { chatImageMaxMiB: 3, memoryImageMaxMiB: 2 },
      })
    );
  });

  it.each(["", "0", "5", "1.5", "abc"])(
    "rejects invalid setting %s",
    async (value) => {
      expect(
        await updateImageUploadLimitsAction({}, form(value))
      ).toHaveProperty("error");
      expect(mocks.transaction).not.toHaveBeenCalled();
    }
  );

  it("does not write when admin authorization fails", async () => {
    mocks.requireAdmin.mockRejectedValue(new Error("ADMIN_REQUIRED"));
    await expect(updateImageUploadLimitsAction({}, form("2"))).rejects.toThrow(
      "ADMIN_REQUIRED"
    );
    expect(mocks.transaction).not.toHaveBeenCalled();
  });

  it("returns recovery feedback if the settings row is missing", async () => {
    mocks.saved.mockResolvedValue([]);
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await updateImageUploadLimitsAction({}, form("2"))).toHaveProperty(
      "error"
    );
    expect(mocks.audit).not.toHaveBeenCalled();
    errorLog.mockRestore();
  });

  it("does not report success when the audit transaction fails", async () => {
    mocks.audit.mockRejectedValue(new Error("DATABASE_UNAVAILABLE"));
    const errorLog = vi.spyOn(console, "error").mockImplementation(() => {});
    expect(await updateImageUploadLimitsAction({}, form("2"))).toHaveProperty(
      "error"
    );
    errorLog.mockRestore();
  });
});

it("rejects an invalid album limit without partially saving chat", async () => {
  expect(
    await updateImageUploadLimitsAction({}, form("3", "5"))
  ).toHaveProperty("error");
  expect(mocks.transaction).not.toHaveBeenCalled();
});
