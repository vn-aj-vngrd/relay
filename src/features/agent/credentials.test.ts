import { afterEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { decryptAgentKey, encryptAgentKey } from "./credentials";

afterEach(() => vi.unstubAllEnvs());
describe("Agent credential encryption", () => {
  it("uses randomized authenticated encryption and round trips", () => {
    vi.stubEnv("AGENT_ENCRYPTION_KEY", "12".repeat(32));
    const one = encryptAgentKey("test-credential");
    const two = encryptAgentKey("test-credential");
    expect(one).not.toBe(two);
    expect(one).not.toContain("test-credential");
    expect(decryptAgentKey(one)).toBe("test-credential");
  });
  it("fails closed for missing keys, tampering and wrong keys", () => {
    vi.stubEnv("AGENT_ENCRYPTION_KEY", "");
    expect(() => encryptAgentKey("test")).toThrow();
    vi.stubEnv("AGENT_ENCRYPTION_KEY", "12".repeat(32));
    const encrypted = encryptAgentKey("test");
    const parts = encrypted.split(".");
    parts[2] = Buffer.alloc(16).toString("base64");
    expect(() => decryptAgentKey(parts.join("."))).toThrow();
    vi.stubEnv("AGENT_ENCRYPTION_KEY", "34".repeat(32));
    expect(() => decryptAgentKey(encrypted)).toThrow();
  });
});
