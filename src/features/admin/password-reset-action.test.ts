import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  auditValues: vi.fn(),
  findUser: vi.fn(),
  getUserById: vi.fn(),
  requireAdmin: vi.fn(),
  transaction: vi.fn(),
  updateUserById: vi.fn(),
}));

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next/navigation", () => ({ redirect: vi.fn() }));
vi.mock("./auth", () => ({ requireAdmin: mocks.requireAdmin }));
vi.mock("@/db/client", () => ({
  db: {
    query: { users: { findFirst: mocks.findUser } },
    transaction: mocks.transaction,
  },
}));
vi.mock("@/lib/supabase/admin", () => ({
  createSupabaseAdminClient: () => ({
    auth: { admin: { getUserById: mocks.getUserById, updateUserById: mocks.updateUserById } },
  }),
}));

import { resetUserPasswordAction } from "./actions";

beforeEach(() => {
  vi.clearAllMocks();
  mocks.requireAdmin.mockResolvedValue({ id: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" });
  mocks.findUser.mockResolvedValue({ id: "90b421fb-70ce-4e86-913f-4f035c516065", email: "player@example.com" });
  mocks.getUserById.mockResolvedValue({
    data: { user: { app_metadata: { provider: "email", existingFlag: true } } },
    error: null,
  });
  mocks.updateUserById.mockResolvedValue({ error: null });
  mocks.transaction.mockImplementation(async (work: (tx: unknown) => Promise<unknown>) =>
    work({ insert: () => ({ values: mocks.auditValues }) }),
  );
});

describe("resetUserPasswordAction", () => {
  it("sets an audited one-time password without removing MFA", async () => {
    const formData = new FormData();
    formData.set("userId", "90b421fb-70ce-4e86-913f-4f035c516065");
    formData.set("reason", "Account owner requested recovery");

    const result = await resetUserPasswordAction({}, formData);

    expect(mocks.requireAdmin).toHaveBeenCalledOnce();
    expect(mocks.updateUserById).toHaveBeenCalledWith(
      "90b421fb-70ce-4e86-913f-4f035c516065",
      expect.objectContaining({
        password: expect.stringMatching(/^Relay-.+7$/),
        app_metadata: { provider: "email", existingFlag: true, force_password_change: true },
      }),
    );
    expect(mocks.auditValues).toHaveBeenCalledWith(
      expect.objectContaining({
        action: "user.password_reset",
        targetType: "user",
        targetId: "90b421fb-70ce-4e86-913f-4f035c516065",
        reason: "Account owner requested recovery",
        metadata: { source: "admin_console", mfaFactorsPreserved: true },
      }),
    );
    expect(result).toEqual({
      success: "Temporary password created. The account’s authenticator remains required.",
      temporaryPassword: expect.stringMatching(/^Relay-.+7$/),
      accountEmail: "player@example.com",
    });
  });
});
