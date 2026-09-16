import { storyColors } from "./story-color";
import type { StoryRegion } from "./story-scene";

export const defaultStoryTheme = "court-pop" as const;
export type StoryArtOptions = {
  subject?: "poster" | "people" | "result";
  accent?: string;
};

/** Palette choices tint the paper as well as the artwork.
 * Full-background photos retain their existing contrast controls. */
export function storySurface<
  T extends { color?: string; light?: boolean; imageUrl?: string },
>(theme: StoryTheme, surface: T): T {
  if (theme === "minimal" || surface.imageUrl) return surface;
  const palette = storyColors.find(
    (option) => option.color.toLowerCase() === surface.color?.toLowerCase()
  );
  return {
    ...surface,
    color: surface.light
      ? surface.color
      : (palette?.soft ?? storyThemePaper(theme)),
    light: true,
  };
}

export function storyThemePaper(theme: StoryTheme) {
  switch (theme) {
    case "scrapbook":
      return "#f7efd9";
    case "coquette":
      return "#fff1f6";
    case "retro-rally":
      return "#f5f2e9";
    default:
      return "#f4f1e8";
  }
}

export function storyArtSubject(
  template: string
): NonNullable<StoryArtOptions["subject"]> {
  if (["crew", "custom", "winning-team"].includes(template)) return "people";
  return ["invitation", "spots", "live", "overview"].includes(template)
    ? "poster"
    : "result";
}

export function storyResultColor(
  theme: StoryTheme,
  surface: { color?: string; light?: boolean; imageUrl?: string },
  foreground: string
) {
  return theme === "court-pop" && !surface.light && !surface.imageUrl
    ? (surface.color ?? foreground)
    : foreground;
}

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
    label: "Studio",
    description:
      "Precise numerals and generous space. A clean performance report.",
  },
  {
    id: "scrapbook",
    label: "Scrapbook",
    description:
      "Clean photo mats, one tape detail, and a handwritten caption. Best for your story and the crew.",
  },
  {
    id: "coquette",
    label: "Soft Serve",
    description:
      "Soft paper, elegant serif captions, and a single ribbon detail. A playful photo story.",
  },
  {
    id: "court-pop",
    label: "Court Pop",
    description:
      "Bold result typography and photo callouts. Best for game highlights and winning moments.",
  },
  {
    id: "retro-rally",
    label: "Clubhouse",
    description:
      "Sports-club typography, ticket borders, and restrained stripes. Made for invitations.",
  },
];

export function storyScoreFont(theme: StoryTheme) {
  if (theme === "coquette") return "Georgia, serif";
  if (theme === "retro-rally") return "Inter, Arial, sans-serif";
  if (theme === "court-pop") return "Inter, Arial, sans-serif";
  return "ui-monospace, SFMono-Regular, monospace";
}

export function storyMemoryInk(theme: StoryTheme, foreground: string) {
  if (foreground !== "#17181d") return foreground;

  if (theme === "coquette") return "#9b365e";
  return foreground;
}

export function storySecondaryInk(light: boolean) {
  return light ? "#5b5963" : "#ffffff";
}

export function storyMemoryFont(theme: StoryTheme) {
  return theme === "scrapbook"
    ? '"Relay Hand", Georgia, serif'
    : storyScoreFont(theme);
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
function scrapbook({
  accent = "#477462",
  subject = "poster",
}: StoryArtOptions = {}): Decoration[] {
  return [
    { path: "M160 188H920V612H160Z", fill: "#fff8e9" },
    { path: "M184 212H896V560H184Z", fill: accent },
    {
      path: "M208 236H872V536H208ZM540 236V536M208 386H872",
      stroke: "#fff8e9",
      strokeWidth: 3,
    },
    ...(subject === "result"
      ? pickleball(540, 386, 104, "#fff8e9", accent)
      : [
          ...paddle(390, 260, "#fff8e9", "#263b35", 1.55),
          ...(subject === "people"
            ? paddle(568, 260, "#fff8e9", "#263b35", 1.55)
            : []),
        ]),
    { path: "M440 176H640V204H440Z", fill: "#dac398" },
  ];
}

function coquette({
  accent = "#eaa7c0",
  subject = "poster",
}: StoryArtOptions = {}): Decoration[] {
  return [
    { path: "M164 396C164 104 916 104 916 396V594H164Z", fill: "#fff8f0" },
    {
      path: "M194 396C194 150 886 150 886 396V564H194Z",
      stroke: accent,
      strokeWidth: 3,
    },
    ...(subject === "result"
      ? pickleball(540, 374, 120, "#fff8f0", accent)
      : [
          ...paddle(392, 244, "#fff8f0", accent, 1.65),
          ...(subject === "people"
            ? paddle(574, 244, "#fff8f0", accent, 1.65)
            : []),
        ]),
    {
      path: "M700 516c-68 -44 -68 44 0 0c68 44 68 -44 0 0M700 516l-20 40M700 516l24 40",
      stroke: accent,
      strokeWidth: 4,
    },
  ];
}

function courtPop({
  subject = "poster",
  accent = "#635bde",
}: StoryArtOptions = {}): Decoration[] {
  const ink = "#17181d";
  const paper = "#f4f1e8";
  if (subject === "result")
    return [
      { path: "M72 180H1008V620H72Z", fill: ink },
      {
        path: "M98 206H982V594H98ZM98 400H982M374 206V594M698 206V594",
        stroke: paper,
        strokeWidth: 4,
      },
      {
        path: "M112 474C276 168 450 610 654 288",
        stroke: paper,
        strokeWidth: 9,
      },
      ...pickleball(776, 394, 186, accent, paper),
      {
        path: "M662 202L648 168M624 224L594 198M702 188L708 164",
        stroke: ink,
        strokeWidth: 6,
      },
    ];
  if (subject === "people")
    return [
      { path: "M110 188L946 164L972 600L136 624Z", fill: ink },
      { path: "M146 206L912 188L934 566L168 586Z", fill: paper },
      {
        path: "M174 234L884 216L902 538L190 554ZM536 226L546 546M180 394L894 376",
        stroke: ink,
        strokeWidth: 4,
      },
      ...paddle(274, 236, accent, ink, 1.9),
      ...paddle(484, 236, "#dcec69", ink, 1.9),
      ...pickleball(758, 458, 86, "#dcec69", ink),
      {
        path: "M218 176L406 164L410 196L222 208ZM758 580L946 568L950 600L762 612Z",
        fill: accent,
      },
    ];
  return [
    { path: "M72 160H1008V640H72Z", fill: ink },
    {
      path: "M96 184H984V616H96ZM540 184V616M372 184V616M708 184V616M96 400H372M708 400H984",
      stroke: paper,
      strokeWidth: 4,
    },
    ...paddle(268, 202, accent, paper, 2.5),
    ...pickleball(768, 400, 196, "#dcec69", ink),
    {
      path: "M146 486C110 324 222 302 194 458C174 550 350 590 414 574",
      stroke: paper,
      strokeWidth: 7,
    },
  ];
}

/** Cropped court rails frame the paper without entering the factual inset. */
export function storyPosterEdges(
  theme: StoryTheme = "court-pop",
  foreground = "#17181d"
): Decoration[] {
  if (theme === "minimal")
    return [
      {
        path: "M44 276V160H160M920 160H1036V276M44 1752V1868H160M920 1868H1036V1752",
        stroke: foreground,
        strokeWidth: 3,
      },
      {
        path: "M20 1010H64M1016 1010H1060",
        stroke: foreground,
        strokeWidth: 3,
      },
    ];
  if (theme === "scrapbook")
    return [
      {
        path: "M40 204V156H88M992 1884H1040V1836",
        stroke: "#d6c8a5",
        strokeWidth: 2,
      },
    ];
  if (theme === "coquette")
    return [
      {
        path: "M44 232V180Q44 148 76 148H220M860 1888H1004Q1036 1888 1036 1856V1804",
        stroke: "#a65072",
        strokeWidth: 2,
      },
    ];
  if (theme === "retro-rally")
    return [
      { path: "M40 160V1880M1040 160V1880", stroke: "#263b35", strokeWidth: 2 },
      ...Array.from({ length: 8 }, (_, index) => ({
        path: circle(414 + index * 36, 1900, 3),
        fill: "#263b35",
      })),
    ];
  return [
    { path: "M20 144H44V1888H20ZM1036 144H1060V1888H1036Z", fill: "#17181d" },
    { path: "M20 140H1060M20 1888H1060", stroke: "#17181d", strokeWidth: 4 },
    ...Array.from({ length: 12 }, (_, index) => ({
      path: `M${20 + index * 88} 0h44v20h-44ZM${64 + index * 88} 1900h44v20h-44Z`,
      fill: "#17181d",
    })),
  ];
}

export function storyPosterPanel(art: StoryRegion): Decoration[] {
  return [
    {
      path: `M${art.x} ${art.y}h${art.width}v${art.height}h${-art.width}Z`,
      fill: "#17181d",
    },
  ];
}

function retroRally({
  accent = "#527562",
  subject = "poster",
}: StoryArtOptions = {}): Decoration[] {
  return [
    {
      path: "M108 180H972V618H108Z",
      fill: "#f5f2e9",
      stroke: "#263b35",
      strokeWidth: 5,
    },
    { path: "M128 200H952V598H128Z", stroke: "#263b35", strokeWidth: 3 },
    { path: "M148 218H932V234H148Z", fill: accent },
    ...Array.from({ length: 12 }, (_, index) => ({
      path: circle(164 + index * 68, 594, 5),
      fill: "#263b35",
    })),

    ...(subject === "result"
      ? pickleball(540, 398, 154, accent, "#f5f2e9")
      : subject === "people"
        ? [
            ...paddle(362, 250, accent, "#263b35", 1.8),
            ...paddle(566, 250, "#fff8f0", "#263b35", 1.8),
          ]
        : [
            ...paddle(434, 226, accent, "#263b35", 2.2),
            ...pickleball(680, 509, 64, "#fff8f0", "#263b35"),
          ]),
  ];
}

// One 1080 × 1920 artwork definition feeds SVG and Canvas. Motifs use a
// y=160–640 source region, transformed uniformly into the scene's art slot.
// Court Pop allocates that slot between its subject and practical details.
// These are Relay's composition choices, not platform-certified safe zones.
export function storyThemeDecorations(
  theme: StoryTheme,
  options?: StoryArtOptions
): Decoration[] {
  switch (theme) {
    case "scrapbook":
      return scrapbook(options);
    case "coquette":
      return coquette(options);
    case "court-pop":
      return courtPop(options);
    case "retro-rally":
      return retroRally(options);
    default:
      return [];
  }
}

/** Artwork stays in the photo mat; never over faces or factual copy. */
export function storyPhotoDecorations(
  theme: StoryTheme,
  frame: StoryRegion,
  options?: StoryArtOptions
): Decoration[] {
  const { x, y, width, height } = frame;
  const right = x + width;
  const bottom = y + height;
  const accent = options?.accent ?? "#215f66";
  if (theme === "minimal") return [];
  if (theme === "scrapbook")
    return [
      {
        path: `M${x + 12} ${y + 12}H${right - 12}V${bottom - 12}H${x + 12}Z`,
        stroke: accent,
        strokeWidth: 2,
      },
      {
        path: `M${x + width / 2 - 90} ${y + 4}h180v24h-180Z`,
        fill: "#dac398",
      },
    ];
  if (theme === "coquette")
    return [
      {
        path: `M${x + 16} ${y + 36}Q${x + 16} ${y + 16} ${x + 36} ${y + 16}H${right - 36}Q${right - 16} ${y + 16} ${right - 16} ${y + 36}V${bottom - 16}H${x + 16}Z`,
        stroke: accent,
        strokeWidth: 2,
      },
      {
        path: `M${right - 112} ${y + 22}c-44 -26 -44 26 0 0c44 26 44 -26 0 0`,
        stroke: accent,
        strokeWidth: 3,
      },
    ];
  if (theme === "court-pop")
    return [
      {
        path: `M${x + 14} ${y + 14}H${right - 14}V${bottom - 14}H${x + 14}Z`,
        stroke: "#17181d",
        strokeWidth: 10,
      },
      { path: `M${x + 50} ${bottom - 20}h240v14h-240Z`, fill: accent },
    ];
  return [
    {
      path: `M${x + 12} ${y + 12}H${right - 12}V${bottom - 12}H${x + 12}Z`,
      stroke: "#683d32",
      strokeWidth: 3,
    },
    {
      path: `M${x + 48} ${bottom - 22}h200v10h-200ZM${right - 248} ${y + 12}h200v10h-200Z`,
      fill: accent,
    },
    ...Array.from({ length: 8 }, (_, index) => ({
      path: circle(x + 350 + index * 30, bottom - 16, 3),
      fill: "#683d32",
    })),
  ];
}

export function drawStoryTheme(
  context: CanvasRenderingContext2D,
  theme: StoryTheme,
  photoFrame?: StoryRegion,
  options?: StoryArtOptions
) {
  if (theme === "minimal") return;
  drawStoryDecorations(
    context,
    photoFrame
      ? storyPhotoDecorations(theme, photoFrame, options)
      : storyThemeDecorations(theme, options)
  );
}

export function drawStoryDecorations(
  context: CanvasRenderingContext2D,
  decorations: Decoration[]
) {
  context.save();
  for (const decoration of decorations) {
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
