import { beforeEach, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  admin: vi.fn(),
  limit: vi.fn(),
  settings: vi.fn(),
  probe: vi.fn(),
}));
vi.mock("@/features/admin/auth", () => ({ requireAdmin: mocks.admin }));
vi.mock("@/lib/rate-limit", () => ({ checkRateLimit: mocks.limit }));
vi.mock("./config", () => ({ readAgentSettings: mocks.settings }));
vi.mock("./connection-test", () => ({ probeAgentConnection: mocks.probe }));
vi.mock("./readiness", () => ({ agentReadiness: () => ({ ready: true }) }));

import { testAgentConnection } from "./connection-action";

beforeEach(() => {
  vi.resetAllMocks();
  mocks.admin.mockResolvedValue({ id: "admin" });
  mocks.limit.mockResolvedValue({ allowed: true });
  mocks.settings.mockResolvedValue({
    config: { model: "saved/model", requireZeroRetention: true },
    encryptedApiKey: "STORED",
  });
  mocks.probe.mockResolvedValue({ success: "Passed" });
});
it("requires the admin guard before reading credentials or probing", async () => {
  mocks.admin.mockRejectedValue(new Error("MFA_REQUIRED"));
  await expect(testAgentConnection({}, new FormData())).rejects.toThrow(
    "MFA_REQUIRED"
  );
  expect(mocks.settings).not.toHaveBeenCalled();
  expect(mocks.probe).not.toHaveBeenCalled();
});
it("tests only saved settings and ignores submitted provider URLs and keys", async () => {
  const form = new FormData();
  form.set("apiKey", "CLIENT_KEY");
  form.set("model", "client/model");
  await testAgentConnection({}, form);
  expect(mocks.probe).toHaveBeenCalledWith("saved/model", "STORED", true);
});
it("rate limits probes before provider access", async () => {
  mocks.limit.mockResolvedValue({ allowed: false });
  expect(await testAgentConnection({}, new FormData())).toHaveProperty("error");
  expect(mocks.probe).not.toHaveBeenCalled();
});
