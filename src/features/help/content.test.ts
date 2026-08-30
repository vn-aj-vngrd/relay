import { describe, expect, it } from "vitest";

import { helpGuides, helpSectionId, playModes } from "./content";

describe("Help Center documentation", () => {
  it("keeps every manual complete and linkable", () => {
    expect(helpGuides).toHaveLength(5);
    expect(new Set(helpGuides.map((guide) => guide.id)).size).toBe(helpGuides.length);

    for (const guide of helpGuides) {
      expect(guide.steps).toHaveLength(3);
      expect(guide.action.href).toMatch(/^\//);
    }
  });

  it("documents every supported play mode", () => {
    expect(playModes.map((mode) => mode.mode)).toEqual([
      "Paddle Stack",
      "Mix It Up",
      "Balanced Mix",
      "Court Climb",
      "Team Round Robin",
    ]);
  });

  it("creates stable section anchors", () => {
    expect(helpSectionId("Play and scores")).toBe("play-and-scores");
  });
});
