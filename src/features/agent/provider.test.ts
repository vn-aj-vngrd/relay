import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("./credentials", () => ({ decryptAgentKey: () => "test-key" }));

import { agentModel } from "./provider";

afterEach(() => vi.unstubAllGlobals());

it("omits unsupported parallel and tool-choice parameters for the answer step", async () => {
  const fetcher = vi.fn().mockResolvedValue(
    Response.json({
      id: "response",
      model: "test/model",
      created: 1,
      choices: [
        {
          index: 0,
          message: { role: "assistant", content: "Summary." },
          finish_reason: "stop",
        },
      ],
      usage: { prompt_tokens: 1, completion_tokens: 1, total_tokens: 2 },
    })
  );
  vi.stubGlobal("fetch", fetcher);
  await agentModel("test/model", "encrypted").doGenerate({
    prompt: [{ role: "user", content: [{ type: "text", text: "Summarize." }] }],
    tools: [],
    toolChoice: { type: "auto" },
  });
  const body = JSON.parse(fetcher.mock.calls[0][1].body as string);
  expect(body).not.toHaveProperty("parallel_tool_calls");
  expect(body).not.toHaveProperty("tool_choice");
  expect(body).not.toHaveProperty("tools");
  expect(body.provider.require_parameters).toBe(true);
  expect(body.provider.zdr).toBe(true);
});
