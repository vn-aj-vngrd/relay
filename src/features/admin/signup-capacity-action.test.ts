import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireAdmin: vi.fn(),
  execute: vi.fn(),
  updateReturning: vi.fn(),
  auditValues: vi.fn(),
  transaction: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("./auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/db/client", () => ({
  db: {
    transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/supabase/admin", () => ({ createSupabaseAdminClient: vi.fn() }));

import { updateSignupCapacityAction } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({
    id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  });
  mocks.updateReturning.mockResolvedValue([{ accountCap: 250 }]);
  mocks.transaction.mockImplementation(
    async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        execute: mocks.execute,
        update: () => ({
          set: () => ({ where: () => ({ returning: mocks.updateReturning }) }),
        }),
        insert: () => ({ values: mocks.auditValues }),
      })
  );
});

describe("updateSignupCapacityAction", () => {
  it("rechecks admin access and saves an audited account limit", async () => {
    const formData = new FormData();
    formData.set("accountCap", "250");

    await expect(updateSignupCapacityAction({}, formData)).resolves.toEqual({
      success: "Account limit saved. Up to 250 accounts can register.",
    });

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.transaction).toHaveBeenCalledOnce();
    expect(mocks.updateReturning).toHaveBeenCalledOnce();
    expect(mocks.auditValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "signup.capacity_updated",
        targetType: "signup_settings",
        targetId: "global",
        metadata: { accountCap: 250 },
      })
    );
  });

  it("rejects an invalid limit before opening a transaction", async () => {
    const formData = new FormData();
    formData.set("accountCap", "0");

    await expect(updateSignupCapacityAction({}, formData)).resolves.toEqual({
      error: "Allow at least one account.",
    });
    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
});
