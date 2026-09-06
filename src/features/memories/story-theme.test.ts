import { afterEach, describe, expect, it, vi } from "vitest";

import {
  drawStoryTheme,
  storyThemeDecorations,
  storyThemes,
} from "./story-theme";

afterEach(() => vi.unstubAllGlobals());

describe("Story themes", () => {
  it("offers five distinct requested styles, preserving Minimal as the default", () => {
    expect(storyThemes.map(({ label }) => label)).toEqual([
      "Minimal",
      "Scrapbook",
      "Coquette",
      "Court Pop",
      "Retro Rally",
    ]);
    expect(storyThemeDecorations("minimal")).toEqual([]);
    const save = vi.fn();
    drawStoryTheme({ save } as unknown as CanvasRenderingContext2D, "minimal");
    expect(save).not.toHaveBeenCalled();
  });

  it("gives every expressive theme its own artwork rather than recoloring one frame", () => {
    const signatures = storyThemes
      .filter(({ id }) => id !== "minimal")
      .map(({ id }) =>
        storyThemeDecorations(id)
          .map(({ path }) => path)
          .join("|")
      );
    expect(new Set(signatures).size).toBe(4);
    for (const { id, description } of storyThemes) {
      expect(description.length).toBeGreaterThan(0);
      if (id !== "minimal")
        expect(storyThemeDecorations(id).length).toBeGreaterThan(10);
    }
  });

  it.each(["scrapbook", "coquette", "court-pop", "retro-rally"] as const)(
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
