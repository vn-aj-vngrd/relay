import { describe, expect, it } from "vitest";

import { courtLabel, startMatchLabel } from "./presentation";

describe("courtLabel", () => {
  it("uses the persisted position without renumbering closed courts", () => {
    expect(courtLabel(1)).toBe("Court 1");
    expect(courtLabel(3)).toBe("Court 3");
  });

  it("does not invent a number for a deleted court", () => {
    expect(courtLabel(null)).toBe("Court");
    expect(courtLabel(undefined)).toBe("Court");
  });
});

describe("startMatchLabel", () => {
  it("calls the first match first and later matches next", () => {
    expect(startMatchLabel(0)).toBe("Start first match");
    expect(startMatchLabel(1)).toBe("Start next match");
    expect(startMatchLabel(6)).toBe("Start next match");
  });
});
