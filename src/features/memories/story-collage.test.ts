import { describe, expect, it } from "vitest";
import {
  defaultPhotoCrop,
  storyPhotoGeometry,
  storyPhotoSlots,
} from "./story-collage";

describe("Story collage composition", () => {
  const box = { x: 112, y: 360, width: 856, height: 1020 };
  it.each(["editorial", "grid"] as const)(
    "keeps every selected photo within a distinct %s slot",
    (layout) => {
      for (let count = 1; count <= 4; count += 1) {
        const slots = storyPhotoSlots(box, count, layout);
        expect(slots).toHaveLength(count);
        for (const [index, slot] of slots.entries()) {
          expect(slot.width).toBeGreaterThan(0);
          expect(slot.height).toBeGreaterThan(0);
          expect(slot.x).toBeGreaterThanOrEqual(box.x);
          expect(slot.y).toBeGreaterThanOrEqual(box.y);
          expect(slot.x + slot.width).toBeLessThanOrEqual(
            box.x + box.width + 0.001
          );
          expect(slot.y + slot.height).toBeLessThanOrEqual(
            box.y + box.height + 0.001
          );
          for (const other of slots.slice(index + 1)) {
            expect(
              slot.x + slot.width <= other.x ||
                other.x + other.width <= slot.x ||
                slot.y + slot.height <= other.y ||
                other.y + other.height <= slot.y
            ).toBe(true);
          }
        }
      }
    }
  );
  it("uses the full existing photo window for one photo and none for an empty selection", () => {
    expect(storyPhotoSlots(box, 1)).toEqual([box]);
    expect(storyPhotoSlots(box, 0)).toEqual([]);
  });
  it("matches cover sizing and independently aligns zoomed overflow on both axes", () => {
    const square = { x: 20, y: 30, width: 500, height: 500 };
    expect(storyPhotoGeometry(1000, 500, square, defaultPhotoCrop)).toEqual({
      x: -230,
      y: 30,
      width: 1000,
      height: 500,
    });
    expect(
      storyPhotoGeometry(1000, 500, square, { x: 100, y: 0, zoom: 2 })
    ).toEqual({ x: -1480, y: 30, width: 2000, height: 1000 });
    expect(
      storyPhotoGeometry(1000, 500, square, { x: 0, y: 100, zoom: 2 })
    ).toEqual({ x: 20, y: -470, width: 2000, height: 1000 });
  });
});
