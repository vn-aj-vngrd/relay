import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ storage: vi.fn(), decrypt: vi.fn() }));
vi.mock("./credentials", () => ({
  agentCredentialStorageReady: mocks.storage,
  decryptAgentKey: mocks.decrypt,
}));

import { agentReadiness } from "./readiness";
import { defaultAgentConfig } from "./validation";

beforeEach(() => {
  mocks.storage.mockReturnValue(true);
  mocks.decrypt.mockReturnValue("secret-key");
});
it("requires enabled capabilities, a model and readable credentials", () => {
  const config = { ...defaultAgentConfig, enabled: true, model: "test/model" };
  expect(agentReadiness(config, "encrypted").ready).toBe(true);
  expect(
    agentReadiness(
      { ...config, allowHelp: false, allowGameData: false },
      "encrypted"
    ).ready
  ).toBe(false);
  expect(agentReadiness(config, null).ready).toBe(false);
  expect(agentReadiness({ ...config, enabled: false }, "encrypted").ready).toBe(
    false
  );
});
it("reports unreadable storage without returning secrets or crypto exceptions", () => {
  mocks.decrypt.mockImplementation(() => {
    throw new Error("PRIVATE_CRYPTO_DETAILS");
  });
  const result = agentReadiness(
    { ...defaultAgentConfig, enabled: true, model: "test/model" },
    "CIPHERTEXT"
  );
  expect(result.ready).toBe(false);
  expect(JSON.stringify(result)).not.toMatch(
    /PRIVATE_CRYPTO_DETAILS|CIPHERTEXT|secret-key/
  );
});
