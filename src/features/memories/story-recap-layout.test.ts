import { describe, expect, it, vi } from "vitest";

import { buildSessionRecap } from "./recap";
import { recapShareTemplates } from "./recap-share";
import {
  drawStoryRecap,
  type RecapStoryInput,
  storyRecapLayout,
} from "./story-recap-layout";
import { storyThemes } from "./story-theme";

const recap = buildSessionRecap(
  [
    {
      id: "one",
      courtLabel: "Court 1",
      teamA: ["a", "b"],
      teamB: ["c", "d"],
      scoreA: 11,
      scoreB: 8,
      status: "completed",
      startedAt: new Date("2026-08-19T10:00:00Z"),
      finishedAt: new Date("2026-08-19T10:12:00Z"),
    },
  ],
  [
    { id: "a", name: "Van" },
    { id: "b", name: "AJ" },
    { id: "c", name: "Mika" },
    { id: "d", name: "Bea" },
  ]
);
const base: RecapStoryInput = {
  title: "Saturday pickleball",
  date: "August 19 · 6–8 PM",
  venue: "Community courts",
  recap,
  viewerPlayerId: "a",
  courtCount: 2,
  customHeadline: "Our kind of game.",
  customNote: "See you next week.",
  theme: "minimal",
  hasPhoto: false,
  photoRole: "background",
  photoPlacement: "center",
  template: "overview",
};
const templates = [
  "live",
  "live-pulse",
  ...recapShareTemplates(recap, "a").map((item) => item.id),
] as const;
const photoModes = [
  { hasPhoto: false, photoRole: "background", photoPlacement: "center" },
  { hasPhoto: true, photoRole: "background", photoPlacement: "center" },
  ...(["top", "center", "bottom"] as const).map((photoPlacement) => ({
    hasPhoto: true,
    photoRole: "foreground" as const,
    photoPlacement,
  })),
] as const;

describe("shared social-story recap layout", () => {
  for (const { id: theme } of storyThemes) {
    for (const template of templates) {
      it.each(photoModes)(
        `${theme}/${template} keeps full-width readable rows for $hasPhoto/$photoRole/$photoPlacement`,
        (photo) => {
          const layout = storyRecapLayout({
            ...base,
            ...photo,
            template,
            theme,
          })!;
          expect(layout.factor).toBe(1);
          expect(layout.blocks[0].size).toBeGreaterThanOrEqual(72);
          expect(layout.separators.length).toBeLessThanOrEqual(1);
          for (const block of layout.blocks) {
            expect(block.x).toBe(72);
            expect(block.size).toBeGreaterThanOrEqual(32);
            expect(block.y).toBeGreaterThanOrEqual(160);
            expect(block.y + block.height).toBeLessThanOrEqual(1810.001);
            const frame = layout.scene.frame;
            if (frame) {
              expect(
                block.y + block.height <= frame.y ||
                  block.y >= frame.y + frame.height + 31.999
              ).toBe(true);
            } else if (theme !== "minimal") {
              expect(block.y).toBeGreaterThanOrEqual(680);
            }
          }
          expect(layout.blocks.find((block) => block.id === "note")!.text).toBe(
            base.customNote
          );
          expect(
            layout.blocks.find((block) => block.id === "schedule")!.text
          ).toBe(base.date);
          expect(
            layout.blocks.find((block) => block.id === "location")!.text
          ).toBe(base.venue);
          if (layout.scene.frame)
            expect(layout.scene.frame.height).toBeGreaterThanOrEqual(479.999);
        }
      );
    }
  }

  it.each(templates)(
    "renders %s with the shared fonts and baselines without squeezing text",
    (template) => {
      const layout = storyRecapLayout({ ...base, template })!;
      const drawn: Array<{ text: string; x: number; y: number; font: string }> =
        [];
      const context = {
        font: "",
        save: vi.fn(),
        restore: vi.fn(),
        fillRect: vi.fn(),
        fillText(text: string, x: number, y: number) {
          drawn.push({ text, x, y, font: this.font });
        },
      };
      drawStoryRecap(
        context as unknown as CanvasRenderingContext2D,
        layout,
        "#fff",
        "#ddd",
        "#aaa"
      );
      expect(drawn).toEqual(
        layout.blocks.flatMap((block) =>
          block.lines.map((text, index) => ({
            text,
            x: block.x,
            y: block.baseline + index * block.size * 1.25,
            font: `${block.weight} ${block.size}px ${block.fontFamily}`,
          }))
        )
      );
      for (const line of layout.separators)
        expect(context.fillRect).toHaveBeenCalledWith(
          line.x,
          line.y,
          line.width,
          line.height
        );
    }
  );

  it("keeps zero-match live updates factual and excludes standings or player identities", () => {
    const empty = buildSessionRecap([], []);
    for (const template of ["live", "live-pulse"] as const) {
      const text = storyRecapLayout({ ...base, template, recap: empty })!
        .blocks.map((block) => block.text)
        .join(" ");
      expect(text).toContain("0");
      expect(text).not.toContain("Van");
      expect(text).not.toContain("wins");
      expect(text).not.toContain("#1");
    }
  });

  it("labels the top-five standings subset and preserves full crew names", () => {
    const standings = Array.from({ length: 8 }, (_, index) => ({
      ...recap.standings[0],
      playerId: `player-${index}`,
      name: `Player ${index} Longname`,
    }));
    const data = { ...recap, standings };
    const table = storyRecapLayout({
      ...base,
      template: "standings",
      recap: data,
    })!;
    expect(table.blocks.find((block) => block.id === "coverage")!.text).toBe(
      "Top 5 of 8 players"
    );
    expect(
      table.blocks.filter((block) => block.id.startsWith("player-"))
    ).toHaveLength(5);
    const crew = storyRecapLayout({ ...base, template: "crew", recap: data })!;
    expect(
      crew.blocks.filter((block) => block.id.startsWith("player-"))
    ).toHaveLength(8);
  });

  it("wraps complete long names and captions before reducing type, without ellipsis", () => {
    const title = "Saturday pickleball with all our friends beside the river";
    const customNote = "W".repeat(150);
    const input = {
      ...base,
      title,
      customNote,
      template: "custom" as const,
      customHeadline: title,
      hasPhoto: true,
      photoRole: "foreground" as const,
      theme: "coquette" as const,
    };
    const layout = storyRecapLayout(input)!;
    expect(layout.blocks[0].lines.join(" ")).toBe(title);
    expect(
      layout.blocks.find((block) => block.id === "note")!.lines.join("")
    ).toBe(customNote);
    expect(layout.scene.frame!.height).toBeGreaterThanOrEqual(479.999);
  });
});
