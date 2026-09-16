import { describe, expect, it, vi } from "vitest";
import { buildSessionRecap } from "./recap";
import { drawStoryPhotoStats, storyPhotoStats } from "./story-photo-stats";

const box = { x: 112, y: 360, width: 856, height: 720 };
const empty = buildSessionRecap([], []);

describe("Photo result overlay", () => {
  it("does not invent activity for an empty game", () => {
    expect(storyPhotoStats(box, empty)).toBeNull();
  });
  it("keeps recorded totals and labels inside the photo even with large numbers", () => {
    const stats = storyPhotoStats(box, {
      ...empty,
      matchCount: 1,
      totalPoints: 123456789,
    })!;
    expect(stats.band.y + stats.band.height).toBe(box.y + box.height);
    expect(stats.metrics.map(({ value, label }) => [value, label])).toEqual([
      ["123456789", "points played"],
      ["1", "match played"],
    ]);
    for (const metric of stats.metrics) {
      expect(metric.baseline).toBeGreaterThan(stats.band.y);
      expect(metric.labelBaseline).toBeLessThan(box.y + box.height);
      expect(metric.size * metric.value.length * 0.65).toBeLessThan(
        box.width / 2
      );
    }
  });
  it("exports the same values and positions used by the preview", () => {
    const stats = storyPhotoStats(box, {
      ...empty,
      matchCount: 8,
      totalPoints: 156,
    })!;
    const context = {
      save: vi.fn(),
      restore: vi.fn(),
      fillRect: vi.fn(),
      fillText: vi.fn(),
    } as unknown as CanvasRenderingContext2D;
    drawStoryPhotoStats(context, stats);
    for (const metric of stats.metrics) {
      expect(context.fillText).toHaveBeenCalledWith(
        metric.value,
        metric.x,
        metric.baseline
      );
      expect(context.fillText).toHaveBeenCalledWith(
        metric.label,
        metric.x,
        metric.labelBaseline
      );
    }
  });
});
