import { afterEach, describe, expect, it, vi } from "vitest";

import {
  drawStoryTheme,
  storyThemeDecorations,
  storyThemes,
} from "./story-theme";

afterEach(() => vi.unstubAllGlobals());

describe("Story themes", () => {
  it("offers exactly the three requested styles, preserving Minimal as the default", () => {
    expect(storyThemes.map(({ label }) => label)).toEqual([
      "Minimal",
      "Scrapbook",
      "Coquette",
    ]);
    expect(storyThemeDecorations("minimal")).toEqual([]);
    const save = vi.fn();
    drawStoryTheme({ save } as unknown as CanvasRenderingContext2D, "minimal");
    expect(save).not.toHaveBeenCalled();
  });

  it.each(["scrapbook", "coquette"] as const)(
    "uses the same %s path geometry for preview and PNG",
    (theme) => {
      const paths: string[] = [];
      vi.stubGlobal(
        "Path2D",
        class {
          constructor(path: string) {
            paths.push(path);
          }
        }
      );
      const context = {
        save: vi.fn(),
        restore: vi.fn(),
        fill: vi.fn(),
        stroke: vi.fn(),
      };
      drawStoryTheme(context as unknown as CanvasRenderingContext2D, theme);
      expect(paths).toEqual(
        storyThemeDecorations(theme).map(({ path }) => path)
      );
      expect(context.restore).toHaveBeenCalledOnce();
      expect(context.stroke).toHaveBeenCalled();
    }
  );
});
