import { describe, expect, it } from "vitest";

import { startMatchLabel } from "./presentation";

describe("startMatchLabel", () => {
  it("calls the first match first and later matches next", () => {
    expect(startMatchLabel(0)).toBe("Start first match");
    expect(startMatchLabel(1)).toBe("Start next match");
    expect(startMatchLabel(6)).toBe("Start next match");
  });
});
