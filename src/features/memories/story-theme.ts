import type { StoryRegion } from "./story-scene";

// Canonical 1080×1920 bounds shared by expressive HTML and PNG.
// Relay composition insets, not official social-platform safe zones.
export const storyComposition = {
  headerTop: 48,
  headerBottom: 128,
  artTop: 160,
  artBottom: 640,
  factsTop: 680,
  factsBottom: 1810,
} as const;

export type StoryTheme =
  | "minimal"
  | "scrapbook"
  | "coquette"
  | "court-pop"
  | "retro-rally";

export const storyThemes: Array<{
  id: StoryTheme;
  label: string;
  description: string;
}> = [
  {
    id: "minimal",
    label: "Minimal",
    description: "Just the game, clean and simple.",
  },
  {
    id: "scrapbook",
    label: "Scrapbook",
    description: "Paper layers, photo corners, and taped-in paddles.",
  },
  {
    id: "coquette",
    label: "Coquette",
    description: "A ribbon-tied paddle, blush pickleball, and scalloped paper.",
  },
  {
    id: "court-pop",
    label: "Court Pop",
    description: "A bold perforated ball across a bright court print.",
  },
  {
    id: "retro-rally",
    label: "Retro Rally",
    description: "Vintage sporting stripes and a printed paddle.",
  },
];

export function storyScoreFont(theme: StoryTheme) {
  if (theme === "coquette" || theme === "retro-rally") return "Georgia, serif";
  if (theme === "court-pop") return "Arial, sans-serif";
  return "ui-monospace, SFMono-Regular, monospace";
}

type Decoration = {
  path: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
};

function circle(x: number, y: number, radius: number) {
  return `M${x - radius} ${y}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 ${-radius * 2} 0Z`;
}

// Original sport illustration, separate from (and never replacing) RelayMark.
function pickleball(
  x: number,
  y: number,
  radius: number,
  color: string,
  ink: string
): Decoration[] {
  return [
    { path: circle(x, y, radius), fill: color, stroke: ink, strokeWidth: 4 },
    ...[
      [0, 0],
      [-0.48, -0.35],
      [0.48, -0.35],
      [-0.4, 0.42],
      [0.4, 0.42],
    ].map(([dx, dy]) => ({
      path: circle(x + dx * radius, y + dy * radius, radius * 0.13),
      fill: ink,
    })),
  ];
}

function paddle(
  x: number,
  y: number,
  color: string,
  ink: string,
  scale = 1
): Decoration[] {
  return [
    {
      path: `M${x + 32 * scale} ${y + 86 * scale}h${24 * scale}v${68 * scale}h${-24 * scale}Z`,
      fill: ink,
    },
    {
      path: `M${x + 25 * scale} ${y}h${38 * scale}q${25 * scale} 0 ${25 * scale} ${26 * scale}v${50 * scale}q0 ${27 * scale} ${-25 * scale} ${27 * scale}h${-38 * scale}q${-25 * scale} 0 ${-25 * scale} ${-27 * scale}v${-50 * scale}q0 ${-26 * scale} ${25 * scale} ${-26 * scale}Z`,
      fill: color,
      stroke: ink,
      strokeWidth: 5,
    },
    {
      path: `M${x + 16 * scale} ${y + 26 * scale}h${56 * scale}M${x + 16 * scale} ${y + 35 * scale}h${56 * scale}`,
      stroke: ink,
      strokeWidth: 3,
    },
    {
      path: `M${x + 33 * scale} ${y + 119 * scale}l${22 * scale} ${8 * scale}M${x + 33 * scale} ${y + 134 * scale}l${22 * scale} ${8 * scale}`,
      stroke: color,
      strokeWidth: 3,
    },
  ];
}

// Each style is one sporting print, with no detached pseudo-writing or badges.
function scrapbook(): Decoration[] {
  return [
    { path: "M150 198L866 164L892 598L176 632Z", fill: "#d9c49b" },
    { path: "M188 180H916V610H188Z", fill: "#fff8e9" },
    { path: "M214 206H890V554H214Z", fill: "#477462" },
    {
      path: "M238 230H866V530H238ZM550 230V530M238 380H866M422 230V530M678 230V530",
      stroke: "#d8e7bd",
      strokeWidth: 4,
    },
    ...paddle(354, 256, "#f6d2be", "#263b35", 1.8),
    ...pickleball(680, 426, 89, "#d0dd81", "#263b35"),
    {
      path: "M254 164L430 180L424 218L248 202ZM752 568L934 548L940 586L758 606Z",
      fill: "#d9c49b",
    },
  ];
}

function coquette(): Decoration[] {
  return [
    {
      path: "M156 402C156 124 924 124 924 402V578H156Z",
      fill: "#fff1f6",
      stroke: "#a65072",
      strokeWidth: 4,
    },
    // Restrained scallops belong to the print edge, not the factual copy.
    ...Array.from({ length: 11 }, (_, index) => ({
      path: `M${188 + index * 64} 592q16 24 32 0`,
      stroke: "#a65072",
      strokeWidth: 3,
    })),
    ...paddle(462, 192, "#ffe0eb", "#813f5a", 2.2),
    ...pickleball(344, 450, 82, "#eaa7c0", "#813f5a"),
    // Bow tied across the paddle's throat; tails follow its handle.
    {
      path: "M552 428L500 566L540 546L561 574L590 430M574 428L680 558L641 548L625 578L552 430",
      fill: "#eaa7c0",
      stroke: "#813f5a",
      strokeWidth: 4,
    },
    {
      path: "M563 430C328 252 364 568 563 430C776 568 800 252 563 430Z",
      fill: "#f8c8db",
      stroke: "#813f5a",
      strokeWidth: 5,
    },
    {
      path: "M549 408Q563 398 581 408L583 446Q563 459 547 446Z",
      fill: "#a65072",
    },
  ];
}

function courtPop(): Decoration[] {
  return [
    { path: "M96 176H984V624H96Z", fill: "#dcec69" },
    {
      path: "M122 202H958V598H122ZM540 202V598M388 202V598M692 202V598M122 400H388M692 400H958",
      stroke: "#234f63",
      strokeWidth: 6,
    },
    // Oversized perforated ball anchors a real court diagram.
    ...pickleball(674, 396, 192, "#f79bbd", "#234f63"),
    { path: "M150 490H316V520H150ZM150 538H278V568H150Z", fill: "#234f63" },
    { path: "M96 176H388V194H96Z", fill: "#234f63" },
  ];
}

function retroRally(): Decoration[] {
  return [
    {
      path: "M108 180H972V618H108Z",
      fill: "#f4dfae",
      stroke: "#683d32",
      strokeWidth: 5,
    },
    { path: "M128 200H952V598H128Z", stroke: "#683d32", strokeWidth: 3 },
    { path: "M148 268H932V308H148ZM148 324H932V364H148Z", fill: "#b96236" },
    { path: "M148 420H932V460H148ZM148 476H932V516H148Z", fill: "#527562" },
    { path: "M396 218H684V580H396Z", fill: "#f4dfae" },
    ...paddle(434, 226, "#527562", "#683d32", 2.2),
    ...pickleball(680, 509, 64, "#df9851", "#683d32"),
  ];
}

// One 1080 × 1920 artwork definition feeds SVG and Canvas. Large motifs occupy
// the print region (y=160–640); poster content starts at y=680 in HTML and
// below it in canvas. Side decoration stays outside the 72px content inset.
// These are Relay's composition choices, not platform-certified safe zones.
export function storyThemeDecorations(theme: StoryTheme): Decoration[] {
  switch (theme) {
    case "scrapbook":
      return scrapbook();
    case "coquette":
      return coquette();
    case "court-pop":
      return courtPop();
    case "retro-rally":
      return retroRally();
    default:
      return [];
  }
}

/** Artwork stays in the photo mat; never over faces or factual copy. */
export function storyPhotoDecorations(
  theme: StoryTheme,
  frame: StoryRegion
): Decoration[] {
  if (theme === "minimal") return [];
  const { x, y, width, height } = frame;
  const right = x + width;
  const bottom = y + height;
  if (theme === "scrapbook")
    return [
      {
        path: `M${x + 12} ${y + 12}H${right - 12}V${bottom - 12}H${x + 12}Z`,
        stroke: "#c9b99b",
        strokeWidth: 4,
      },
      {
        path: `M${x + 148} ${y + 8}l180 8 -2 28 -180 -8ZM${right - 256} ${bottom - 34}l180 -8 2 28 -180 8Z`,
        fill: "#d9c49b",
      },
      ...paddle(x + 23, y + height / 2 - 100, "#477462", "#263b35", 0.8),
      ...pickleball(x + 58, y + height / 2 + 82, 32, "#d0dd81", "#263b35"),
    ];
  if (theme === "coquette")
    return [
      {
        path: `M${x + 14} ${y + 14}H${right - 14}V${bottom - 14}H${x + 14}Z`,
        stroke: "#a65072",
        strokeWidth: 3,
      },
      ...Array.from({ length: 10 }, (_, index) => ({
        path: `M${x + 128 + index * 72} ${y + 18}q18 22 36 0M${x + 128 + index * 72} ${bottom - 18}q18 -22 36 0`,
        stroke: "#d18aa6",
        strokeWidth: 3,
      })),
      ...paddle(x + 25, y + height / 2 - 110, "#ffe0eb", "#813f5a", 0.75),
      {
        path: `M${x + 58} ${y + height / 2}c-72 -62 -64 58 0 0c72 58 64 -62 0 0m-4 0 -20 70 24 -14 20 14 -16 -70`,
        fill: "#eaa7c0",
        stroke: "#813f5a",
        strokeWidth: 3,
      },
    ];
  if (theme === "court-pop")
    return [
      { path: `M${x} ${y}h100v${height}h-100Z`, fill: "#dcec69" },
      {
        path: `M${x + 112} ${y + 24}H${right - 24}V${bottom - 24}H${x + 112}Z`,
        stroke: "#234f63",
        strokeWidth: 8,
      },
      ...[0.2, 0.5, 0.8].flatMap((at) =>
        pickleball(x + 50, y + height * at, 38, "#f79bbd", "#234f63")
      ),
    ];
  return [
    {
      path: `M${x + 12} ${y + 12}H${right - 12}V${bottom - 12}H${x + 12}Z`,
      stroke: "#683d32",
      strokeWidth: 4,
    },
    {
      path: `M${x + 20} ${y + 28}h20v${height - 56}h-20ZM${x + 48} ${y + 28}h20v${height - 56}h-20ZM${x + 76} ${y + 28}h20v${height - 56}h-20Z`,
      fill: "#b96236",
    },
    { path: `M${x + 16} ${y + height / 2 - 100}h88v200h-88Z`, fill: "#f4dfae" },
    ...paddle(x + 25, y + height / 2 - 65, "#527562", "#683d32", 0.8),
  ];
}

export function drawStoryTheme(
  context: CanvasRenderingContext2D,
  theme: StoryTheme,
  photoFrame?: StoryRegion
) {
  if (theme === "minimal") return;
  context.save();
  for (const decoration of photoFrame
    ? storyPhotoDecorations(theme, photoFrame)
    : storyThemeDecorations(theme)) {
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
