import { afterEach, expect, it, vi } from "vitest";

const registerOTel = vi.hoisted(() => vi.fn());
vi.mock("@vercel/otel", () => ({ registerOTel }));

import { onRequestError, register } from "./instrumentation";

afterEach(() => {
  vi.unstubAllEnvs();
  vi.restoreAllMocks();
  registerOTel.mockClear();
});

it("registers tracing only when enabled on Node", async () => {
  vi.stubEnv("NEXT_RUNTIME", "nodejs");
  vi.stubEnv("AGENT_OTEL_ENABLED", "false");
  await register();
  expect(registerOTel).not.toHaveBeenCalled();
  vi.stubEnv("AGENT_OTEL_ENABLED", "true");
  await register();
  expect(registerOTel).toHaveBeenCalledWith("relay-agent");
});

it("retains the existing Next request-error hook", () => {
  expect(typeof onRequestError).toBe("function");
});
