export type StoryTheme = "minimal" | "scrapbook" | "coquette";

export const storyThemes: Array<{ id: StoryTheme; label: string }> = [
  { id: "minimal", label: "Minimal" },
  { id: "scrapbook", label: "Scrapbook" },
  { id: "coquette", label: "Coquette" },
];

type Decoration = {
  path: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

// One 1080 × 1920 geometry for HTML and PNG. Decorations stay in the outer
// 56px margin, outside the renderer’s 72px content inset and header baseline.
export function storyThemeDecorations(theme: StoryTheme): Decoration[] {
  if (theme === "minimal") return [];
  if (theme === "scrapbook") {
    return [
      { path: "M20 20H1060V1900H20Z", stroke: "#eee5d2", strokeWidth: 24 },
      ...Array.from({ length: 22 }, (_, index) => {
        const y = 96 + index * 80;
        return {
          path: `M12 ${y}l16 3M1052 ${y + 16}l16 -3`,
          stroke: "#c9b99b",
          strokeWidth: 2,
        };
      }),
      { path: "M438 8L644 14L638 48L432 42Z", fill: "#d9c49b" },
      { path: "M438 1892L644 1898L638 1918L432 1912Z", fill: "#d9c49b" },
    ];
  }
  return [
    { path: "M18 18H1062V1902H18Z", stroke: "#f2d5df", strokeWidth: 16 },
    ...Array.from({ length: 21 }, (_, index) => {
      const y = 128 + index * 80;
      return {
        path: `M26 ${y}C56 ${y + 8} 56 ${y + 32} 26 ${y + 40}M1054 ${y}C1024 ${y + 8} 1024 ${y + 32} 1054 ${y + 40}`,
        stroke: "#f2d5df",
        strokeWidth: 3,
      };
    }),
    {
      path: "M540 30C484 -2 480 58 540 30C600 -2 596 58 540 30M539 31L520 54M541 31L560 54",
      stroke: "#e3a7bc",
      strokeWidth: 6,
    },
  ];
}

export function drawStoryTheme(
  context: CanvasRenderingContext2D,
  theme: StoryTheme
) {
  if (theme === "minimal") return;
  context.save();
  for (const decoration of storyThemeDecorations(theme)) {
    const path = new Path2D(decoration.path);
    if (decoration.fill) {
      context.fillStyle = decoration.fill;
      context.fill(path);
    }
    if (decoration.stroke) {
      context.strokeStyle = decoration.stroke;
      context.lineWidth = decoration.strokeWidth ?? 1;
      context.stroke(path);
    }
  }
  context.restore();
}
