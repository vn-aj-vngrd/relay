import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  transaction: vi.fn(),
  save: vi.fn(),
  audit: vi.fn(),
  decrypt: vi.fn(),
  encrypt: vi.fn(),
}));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("@/features/admin/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/db/client", () => ({ db: { transaction: mocks.transaction } }));
vi.mock("./credentials", () => ({
  encryptAgentKey: mocks.encrypt,
  decryptAgentKey: mocks.decrypt,
}));

import { agentSettings } from "@/db/schema";
import { saveAgentSettings } from "./actions";

function form() {
  const data = new FormData();
  data.set("model", "test/model");
  data.set("instructions", "Keep it brief");
  data.set("maxOutputTokens", "1200");
  data.set("requestsPerHour", "30");
  data.set("allowHelp", "on");
  return data;
}
beforeEach(() => {
  vi.resetAllMocks();
  mocks.admin.mockResolvedValue({ id: "admin" });
  mocks.encrypt.mockReturnValue("NEW_CIPHERTEXT");
  mocks.decrypt.mockReturnValue("PRIVATE_KEY");
  mocks.transaction.mockImplementation(
    async (work: (tx: unknown) => Promise<unknown>) =>
      work({
        insert: (table: unknown) => ({
          values:
            table === agentSettings
              ? () => ({ onConflictDoNothing: vi.fn() })
              : mocks.audit,
        }),
        select: () => ({
          from: () => ({
            where: () => ({
              for: async () => [{ encryptedApiKey: "EXISTING_CIPHERTEXT" }],
            }),
          }),
        }),
        update: () => ({
          set: (value: unknown) => {
            mocks.save(value);
            return { where: vi.fn() };
          },
        }),
      })
  );
});
describe("Agent administrator settings", () => {
  it("saves configurable monthly limits without resetting usage", async () => {
    const data = form();
    data.set("freeMessages", "75");
    data.set("plusMessages", "350");
    data.set("proMessages", "900");
    expect(await saveAgentSettings({}, data)).toHaveProperty("success");
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({
        freeMessages: 75,
        plusMessages: 350,
        proMessages: 900,
      })
    );
  });
  it("rejects blank, negative or non-integer message allowances", async () => {
    for (const value of ["", "-1", "1.5", "100001"]) {
      const data = form();
      data.set("freeMessages", value);
      expect(await saveAgentSettings({}, data)).toHaveProperty("error");
    }
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("requires the MFA admin guard before writes", async () => {
    mocks.admin.mockRejectedValue(new Error("MFA_REQUIRED"));
    await expect(saveAgentSettings({}, form())).rejects.toThrow("MFA_REQUIRED");
    expect(mocks.transaction).not.toHaveBeenCalled();
  });
  it("retains an existing key for blank input and omits credentials/instructions from audit", async () => {
    expect(await saveAgentSettings({}, form())).toHaveProperty("success");
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ encryptedApiKey: "EXISTING_CIPHERTEXT" })
    );
    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain("CIPHERTEXT");
    expect(JSON.stringify(mocks.audit.mock.calls)).not.toContain(
      "Keep it brief"
    );
  });
  it("encrypts replacement credentials and returns no credential material", async () => {
    const data = form();
    data.set("apiKey", "sk-or-test-credential");
    const result = await saveAgentSettings({}, data);
    expect(mocks.encrypt).toHaveBeenCalledWith("sk-or-test-credential");
    expect(mocks.save).toHaveBeenCalledWith(
      expect.objectContaining({ encryptedApiKey: "NEW_CIPHERTEXT" })
    );
    expect(JSON.stringify(result)).not.toContain("credential");
  });
  it("refuses enablement when removing the key", async () => {
    const data = form();
    data.set("enabled", "on");
    data.set("removeKey", "on");
    expect(await saveAgentSettings({}, data)).toHaveProperty("error");
    expect(mocks.save).not.toHaveBeenCalled();
  });
});
