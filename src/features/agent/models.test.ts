import { afterEach, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));

import { getAgentModels } from "./models";

afterEach(() => vi.unstubAllGlobals());
it("suggests unique models from zero-retention endpoints with tool-choice support", async () => {
  const compatible = {
    model_id: "test/compatible",
    model_name: "Compatible",
    supported_parameters: ["tools", "tool_choice"],
  };
  const fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      data: [
        compatible,
        compatible,
        {
          model_id: "test/no-tools",
          model_name: "No tools",
          supported_parameters: [],
        },
      ],
    }),
  });
  vi.stubGlobal("fetch", fetch);
  expect(await getAgentModels()).toEqual([
    { id: "test/compatible", name: "Compatible" },
  ]);
  expect(fetch.mock.calls[0][0]).toBe(
    "https://openrouter.ai/api/v1/endpoints/zdr"
  );
});
