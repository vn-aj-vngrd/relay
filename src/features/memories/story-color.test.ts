import { describe, expect, it } from "vitest";
import { sessionAccents } from "@/features/sessions/accent";
import { storyColors, storyColorsForGame } from "./story-color";
import {
  storyMemoryInk,
  storySecondaryInk,
  storySurface,
  storyThemes,
} from "./story-theme";

function luminance(hex: string) {
  return [0.2126, 0.7152, 0.0722].reduce((sum, weight, index) => {
    const channel =
      Number.parseInt(hex.slice(1 + index * 2, 3 + index * 2), 16) / 255;
    return (
      sum +
      weight *
        (channel <= 0.04045
          ? channel / 12.92
          : ((channel + 0.055) / 1.055) ** 2.4)
    );
  }, 0);
}

function contrast(a: string, b: string) {
  const low = Math.min(luminance(a), luminance(b));
  const high = Math.max(luminance(a), luminance(b));
  return (high + 0.05) / (low + 0.05);
}

describe("Curated story colors", () => {
  it.each(sessionAccents)(
    "starts with the $label game color without duplicates",
    ({ id, solid }) => {
      const colors = storyColorsForGame(id);
      expect(colors).toHaveLength(9);
      expect(new Set(colors.map((color) => color.id)).size).toBe(9);
      expect(colors[0].color).toBe(solid);
      expect(colors.slice(6).map((color) => color.label)).toEqual([
        "Baby Pink",
        "Cream",
        "Ink",
      ]);
    }
  );
  it.each(storyThemes)(
    "keeps primary, secondary and handwritten text readable in $label",
    ({ id }) => {
      for (const palette of storyColors) {
        const surface = storySurface(id, palette);
        const foreground = surface.light ? "#17181d" : "#ffffff";
        for (const ink of [
          foreground,
          storySecondaryInk(Boolean(surface.light)),
          storyMemoryInk(id, foreground),
        ]) {
          expect(contrast(surface.color, ink)).toBeGreaterThanOrEqual(4.5);
        }
      }
    }
  );
});
