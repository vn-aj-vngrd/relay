import { afterEach, describe, expect, it, vi } from "vitest";

import {
  defaultStoryTheme,
  drawStoryDecorations,
  drawStoryTheme,
  storyArtSubject,
  storyMemoryFont,
  storyPhotoDecorations,
  storyPosterEdges,
  storyScoreFont,
  storySurface,
  storyThemeDecorations,
  storyThemePaper,
  storyThemes,
} from "./story-theme";

afterEach(() => vi.unstubAllGlobals());

describe("Story themes", () => {
  it("applies selected palette colors to Court Pop paper while preserving light paper and full photos", () => {
    expect(defaultStoryTheme).toBe("court-pop");
    expect(storySurface("court-pop", { color: "#635bde" })).toEqual({
      color: "#eeecff",
      light: true,
    });
    const pink = { color: "#ffe0eb", light: true };
    expect(storySurface("court-pop", pink)).toEqual(pink);
    const photo = { imageUrl: "blob:local-photo" };
    expect(storySurface("court-pop", photo)).toBe(photo);
    expect(storySurface("minimal", pink)).toBe(pink);
  });

  it.each(storyThemes)(
    "changes $label paper when the selected palette changes",
    ({ id }) => {
      const blue = storySurface(id, { color: "#2563eb" });
      const coral = storySurface(id, { color: "#bd4545" });
      expect(blue.color).toBe(id === "minimal" ? "#2563eb" : "#eaf1ff");
      expect(coral.color).toBe(id === "minimal" ? "#bd4545" : "#ffeded");
      expect(blue.color).not.toBe(coral.color);
    }
  );

  it.each(storyThemes)(
    "preserves $label paper, photo contrast and shared edge rendering",
    ({ id }) => {
      const surface = { color: "#347571" };
      expect(storySurface(id, surface)).toEqual(
        id === "minimal" ? surface : { color: storyThemePaper(id), light: true }
      );
      const photo = { imageUrl: "blob:local-photo", color: "#347571" };
      expect(storySurface(id, photo)).toBe(photo);
      const pink = { color: "#ffe0eb", light: true };
      expect(storySurface(id, pink)).toEqual(pink);
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
      const edges = storyPosterEdges(id, "#ffffff");
      drawStoryDecorations(
        context as unknown as CanvasRenderingContext2D,
        edges
      );
      expect(paths).toEqual(edges.map(({ path }) => path));
      expect(edges.length).toBeGreaterThan(0);
    }
  );

  it.each(storyThemes.filter(({ id }) => id !== "minimal"))(
    "carries the selected accent into $label artwork and photo mat",
    ({ id }) => {
      const options = { accent: "#347571" };
      const frame = { x: 72, y: 160, width: 936, height: 840 };
      expect(
        storyThemeDecorations(id, options).some(
          ({ fill, stroke }) =>
            fill === options.accent || stroke === options.accent
        )
      ).toBe(true);
      expect(
        storyPhotoDecorations(id, frame, options).some(
          ({ fill, stroke }) =>
            fill === options.accent || stroke === options.accent
        )
      ).toBe(true);
    }
  );

  it.each(["poster", "people", "result"] as const)(
    "exports the same selected accent and %s artwork as the preview",
    (subject) => {
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
      const options = { subject, accent: "#347571" };
      drawStoryTheme(
        context as unknown as CanvasRenderingContext2D,
        "court-pop",
        undefined,
        options
      );
      const art = storyThemeDecorations("court-pop", options);
      expect(paths).toEqual(art.map(({ path }) => path));
      expect(
        art.some(
          ({ fill, stroke }) =>
            fill === options.accent || stroke === options.accent
        )
      ).toBe(true);
    }
  );

  it("gives invitations, people and results distinct art using existing focus IDs", () => {
    expect(storyArtSubject("invitation")).toBe("poster");
    expect(storyArtSubject("crew")).toBe("people");
    expect(storyArtSubject("points")).toBe("result");
    const art = ["invitation", "crew", "points"].map((template) =>
      JSON.stringify(
        storyThemeDecorations("court-pop", {
          subject: storyArtSubject(template),
        })
      )
    );
    expect(new Set(art).size).toBe(3);
  });
  it("offers five distinct requested styles, retaining Minimal without a hero illustration", () => {
    expect(storyThemes.map(({ label }) => label)).toEqual([
      "Studio",
      "Scrapbook",
      "Soft Serve",
      "Court Pop",
      "Clubhouse",
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
        expect(storyThemeDecorations(id).length).toBeGreaterThan(0);
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
  it.each(["scrapbook", "coquette", "court-pop", "retro-rally"] as const)(
    "shares %s foreground surround paths with Canvas",
    (theme) => {
      const frame = { x: 72, y: 160, width: 936, height: 840 };
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
      drawStoryTheme(
        context as unknown as CanvasRenderingContext2D,
        theme,
        frame
      );
      expect(paths).toEqual(
        storyPhotoDecorations(theme, frame).map(({ path }) => path)
      );
      expect(storyPhotoDecorations("minimal", frame)).toEqual([]);
    }
  );
});

it.each(storyThemes.filter(({ id }) => id !== "minimal"))(
  "$label changes its sporting composition with the story subject",
  ({ id }) => {
    const signatures = (["poster", "people", "result"] as const).map(
      (subject) => JSON.stringify(storyThemeDecorations(id, { subject }))
    );
    expect(new Set(signatures).size).toBe(3);
    expect(storyArtSubject("winning-team")).toBe("people");
  }
);

it("distinguishes diary, soft editorial and sporting typography", () => {
  expect(storyMemoryFont("scrapbook")).toContain("Relay Hand");
  expect(storyMemoryFont("coquette")).toBe("Georgia, serif");
  expect(storyScoreFont("retro-rally")).toBe("Inter, Arial, sans-serif");
  expect(storyScoreFont("minimal")).toContain("monospace");
});
