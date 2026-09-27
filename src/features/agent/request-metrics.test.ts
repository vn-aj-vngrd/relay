import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/db/client", () => ({ db: {} }));

import { openRouterCostMicros } from "./request-metrics";

describe("OpenRouter request cost", () => {
  it("uses reported USD cost without estimating missing prices", () => {
    expect(
      openRouterCostMicros({ openrouter: { usage: { cost: 0.001234 } } })
    ).toBe(1234);
    expect(openRouterCostMicros({ openrouter: { usage: {} } })).toBeNull();
    expect(
      openRouterCostMicros({ openrouter: { usage: { cost: -2 } } })
    ).toBeNull();
    expect(
      openRouterCostMicros({ openrouter: { usage: { cost: "0.1" } } })
    ).toBeNull();
    expect(
      openRouterCostMicros({ openrouter: { usage: { cost: 10_000 } } })
    ).toBeNull();
  });
});
