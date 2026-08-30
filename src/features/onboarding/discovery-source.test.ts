import { describe, expect, it } from "vitest";

import { discoverySourceLabel, discoverySourceValues } from "./discovery-source";

describe("discovery source", () => {
  it("keeps onboarding answers bounded and presentation-ready", () => {
    expect(discoverySourceValues).toEqual(["friend", "group_chat", "social", "search", "other"]);
    expect(discoverySourceLabel("group_chat")).toBe("A group chat or shared game");
    expect(discoverySourceLabel(null)).toBe("Not answered");
  });
});
