import { beforeEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
const mocks = vi.hoisted(() => ({ stream: vi.fn(), model: vi.fn() }));
vi.mock("ai", async (original) => ({
  ...(await original<typeof import("ai")>()),
  streamText: mocks.stream,
}));
vi.mock("./credentials", () => ({ decryptAgentKey: () => "PRIVATE_KEY" }));
vi.mock("@openrouter/ai-sdk-provider", () => ({
  createOpenRouter: () => ({ chat: mocks.model }),
}));

import { probeAgentConnection } from "./connection-test";

beforeEach(() => vi.clearAllMocks());
it("tests streaming and synthetic tool use without application data", async () => {
  mocks.stream.mockReturnValue({
    fullStream: (async function* () {
      yield { type: "tool-result", toolName: "connection_check" };
      yield { type: "text-delta", text: "Ready" };
    })(),
  });
  expect(await probeAgentConnection("test/model", "encrypted")).toHaveProperty(
    "success"
  );
  const options = mocks.stream.mock.calls[0][0];
  expect(Object.keys(options.tools)).toEqual(["connection_check"]);
  expect(options.maxRetries).toBe(0);
  expect(mocks.model.mock.calls[0][1].provider).toEqual({
    require_parameters: true,
    data_collection: "deny",
    zdr: true,
  });
});
it("returns useful safe failures without echoing provider bodies or secrets", async () => {
  mocks.stream.mockReturnValue({
    fullStream: (async function* () {
      yield {
        type: "error",
        error: { statusCode: 404, message: "PRIVATE_KEY BODY" },
      };
    })(),
  });
  const result = await probeAgentConnection("test/model", "encrypted");
  expect(result.error).toContain("zero data retention");
  expect(JSON.stringify(result)).not.toMatch(/PRIVATE_KEY|BODY/);
});
it("does not pass a model that produces no tool result", async () => {
  mocks.stream.mockReturnValue({
    fullStream: (async function* () {
      yield { type: "text-delta", text: "Ready" };
    })(),
  });
  expect(await probeAgentConnection("test/model", "encrypted")).toHaveProperty(
    "error"
  );
});

it("uses provider-policy routing only when explicitly selected", async () => {
  mocks.stream.mockReturnValue({
    fullStream: (async function* () {
      yield { type: "tool-result", toolName: "connection_check" };
      yield { type: "text-delta", text: "Ready" };
    })(),
  });
  await probeAgentConnection("test/model", "encrypted", false);
  expect(mocks.model.mock.calls[0][1].provider).toEqual({
    require_parameters: true,
    data_collection: "allow",
    zdr: false,
  });
  expect(mocks.stream.mock.calls[0][0].toolChoice).toBeUndefined();
});
