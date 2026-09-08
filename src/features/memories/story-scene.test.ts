import { describe, expect, it } from "vitest";

import {
  babyPink,
  type StoryRegion,
  storyArtTransform,
  storyScene,
} from "./story-scene";
import { storyThemes } from "./story-theme";

function overlaps(a: StoryRegion, b: StoryRegion) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

describe("Story scene geometry", () => {
  it("preserves default full-background geometry and undecorated Minimal", () => {
    const scene = storyScene("minimal", true);
    expect(scene.photo).toEqual({ x: 0, y: 0, width: 1080, height: 1920 });
    expect(scene.fitFacts).toBe(false);
    expect(scene.frame).toBeNull();
    expect(storyScene("minimal", false, "foreground").framed).toBe(false);
  });

  it("reclaims Center whitespace for recap facts while retaining distinct placements", () => {
    for (const { id } of storyThemes) {
      const top = storyScene(id, true, "foreground", "top");
      const center = storyScene(id, true, "foreground", "center");
      const bottom = storyScene(id, true, "foreground", "bottom");
      expect(center.facts.height).toBe(778); // Previously only 498px.
      expect(center.facts.width).toBe(936);
      expect(center.frame!.height).toBeGreaterThanOrEqual(740);
      expect(center.frame!.y).toBeGreaterThan(top.frame!.y);
      expect(bottom.frame!.y).toBeGreaterThan(center.frame!.y);
      expect(center.facts.y + center.facts.height).toBeLessThanOrEqual(1810);
    }
  });

  it.each(storyThemes)(
    "$id reserves footer space without resizing background photography or art",
    ({ id }) => {
      const off = storyScene(id, true, "background", "center", true, {
        bottom: 1810,
      });
      for (const bottom of [1504, 1696, 1810]) {
        const scene = storyScene(id, true, "background", "center", true, {
          bottom,
        });
        expect(scene.photo).toEqual(off.photo);
        expect(scene.art).toEqual(off.art);
        expect(scene.facts.x).toBe(off.facts.x);
        expect(scene.facts.width).toBe(off.facts.width);
        expect(scene.facts.y).toBe(id === "minimal" ? 160 : 680);
        expect(scene.facts.y + scene.facts.height).toBe(bottom);
        if (id !== "minimal")
          expect(overlaps(scene.art, scene.facts)).toBe(false);
      }
    }
  );

  it("keeps the Pink ID with a brighter Story-only palette", () => {
    expect(babyPink).toEqual({
      id: "story:pink",
      label: "Baby Pink",
      color: "#ffe0eb",
      light: true,
    });
  });

  for (const { id } of storyThemes) {
    it.each(["top", "center", "bottom"] as const)(
      `${id} allocates nonoverlapping %s foreground photo, art and facts`,
      (placement) => {
        const scene = storyScene(id, true, "foreground", placement);
        expect(scene.fitFacts).toBe(true);
        expect(scene.frame).not.toBeNull();
        const frame = scene.frame as StoryRegion;
        expect(overlaps(frame, scene.facts)).toBe(false);
        if (id !== "minimal") {
          expect(scene.art).toEqual(frame);
          expect(overlaps(scene.art, scene.facts)).toBe(false);
        }
        for (const box of [frame, scene.photo, scene.facts, scene.art]) {
          expect(box.x).toBeGreaterThanOrEqual(72);
          expect(box.x + box.width).toBeLessThanOrEqual(1008);
          expect(box.y).toBeGreaterThanOrEqual(160);
          expect(box.y + box.height).toBeLessThanOrEqual(1810);
        }
        expect(scene.photo.x - frame.x).toBe(id === "minimal" ? 20 : 116);
        expect(scene.photo.y - frame.y).toBe(id === "minimal" ? 20 : 40);
        const transform = storyArtTransform(scene.art);
        expect(transform.scale * 480).toBeLessThanOrEqual(scene.art.height);
        expect(transform.scale * 936).toBeLessThanOrEqual(scene.art.width);
        expect(storyScene(id, true, "background", placement).photo).toEqual({
          x: 0,
          y: 0,
          width: 1080,
          height: 1920,
        });
      }
    );
  }
});
