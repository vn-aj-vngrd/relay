import { describe, expect, it } from "vitest";

import {
  playingExperienceLabel,
  playingExperienceWeight,
} from "./playing-experience";

describe("playing experience", () => {
  it("maps recreational labels to deterministic balancing weights", () => {
    expect(playingExperienceWeight("new")).toBe(1);
    expect(playingExperienceWeight("experienced")).toBe(4);
    expect(playingExperienceLabel("regular")).toBe("Regular");
  });

  it("uses a neutral middle weight when experience is missing", () => {
    expect(playingExperienceWeight(null)).toBe(2.5);
    expect(playingExperienceWeight("unknown")).toBe(2.5);
    expect(playingExperienceLabel(null)).toBe("Not set");
  });
});
