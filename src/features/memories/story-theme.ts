import { storyColors } from "./story-color";
import type { StoryRegion } from "./story-scene";

export const defaultStoryTheme = "scrapbook" as const;
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
      return "#f4dfae";
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
    label: "Minimal",
    description: "Clean scorecard type and fine court-line corners.",
  },
  {
    id: "scrapbook",
    label: "Scrapbook",
    description: "Taped court keepsakes for your crew and game highlights.",
  },
  {
    id: "coquette",
    label: "Coquette",
    description: "Blush paper, ribbon-tied paddles, and keepsake scores.",
  },
  {
    id: "court-pop",
    label: "Court Pop",
    description:
      "Big type, courtside collage, and a little pickleball attitude.",
  },
  {
    id: "retro-rally",
    label: "Retro Rally",
    description:
      "Vintage court tickets, sporting stripes, and match-day memories.",
  },
];

export function storyScoreFont(theme: StoryTheme) {
  if (theme === "coquette" || theme === "retro-rally") return "Georgia, serif";
  if (theme === "court-pop") return "Inter, Arial, sans-serif";
  return "ui-monospace, SFMono-Regular, monospace";
}

export function storyMemoryInk(theme: StoryTheme, foreground: string) {
  if (foreground !== "#17181d") return foreground;
  if (theme === "scrapbook") return "#2454b8";
  if (theme === "coquette") return "#9b365e";
  return foreground;
}

export function storySecondaryInk(light: boolean) {
  return light ? "#5b5963" : "#ffffff";
}

export function storyMemoryFont(theme: StoryTheme) {
  return theme === "scrapbook" || theme === "coquette"
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
    { path: "M96 212L904 164L940 598L128 636Z", fill: "#d9c49b" },
    { path: "M112 252L974 196L998 570L140 628Z", fill: "#e5a07b" },
    { path: "M188 180H916V610H188Z", fill: "#fff8e9" },
    { path: "M214 206H890V554H214Z", fill: "#477462" },
    {
      path: "M238 230H866V530H238ZM550 230V530M238 380H866M422 230V530M678 230V530",
      stroke: "#d8e7bd",
      strokeWidth: 4,
    },
    {
      path: "M262 492C218 288 442 224 628 302",
      stroke: "#d8e7bd",
      strokeWidth: 7,
    },
    ...(subject === "result"
      ? pickleball(550, 380, 158, accent, "#d8e7bd")
      : [
          ...paddle(310, 234, accent, "#263b35", 1.9),
          ...(subject === "people"
            ? paddle(524, 234, "#f6d2be", "#263b35", 1.9)
            : []),
          ...pickleball(756, 440, 88, "#d0dd81", "#263b35"),
        ]),
    {
      path: "M254 164L430 180L424 218L248 202ZM752 568L934 548L940 586L758 606Z",
      fill: "#d9c49b",
    },
  ];
}

function coquette({
  accent = "#eaa7c0",
  subject = "poster",
}: StoryArtOptions = {}): Decoration[] {
  return [
    {
      path: "M156 402C156 124 924 124 924 402V578H156Z",
      fill: "#fff1f6",
      stroke: "#a65072",
      strokeWidth: 4,
    },
    {
      path: "M188 402C188 166 892 166 892 402V550H188Z",
      stroke: "#d18aa6",
      strokeWidth: 3,
    },
    {
      path: "M224 464H856M310 346V550M770 346V550",
      stroke: "#e8b5c9",
      strokeWidth: 3,
    },
    // Scallops belong to the print edge, not the factual copy.
    ...Array.from({ length: 11 }, (_, index) => ({
      path: `M${188 + index * 64} 592q16 24 32 0`,
      stroke: "#a65072",
      strokeWidth: 3,
    })),
    ...(subject === "result"
      ? pickleball(560, 332, 146, "#f8c8db", "#813f5a")
      : subject === "people"
        ? [
            ...paddle(382, 216, "#ffe0eb", "#813f5a", 1.75),
            ...paddle(592, 216, "#ffe0eb", "#813f5a", 1.75),
          ]
        : [
            ...paddle(462, 192, "#ffe0eb", "#813f5a", 2.2),
            ...pickleball(344, 450, 82, "#eaa7c0", "#813f5a"),
          ]),
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
      fill: accent,
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
        path: "M0 144L34 156L22 298L38 474L20 658L34 860L18 1084L32 1320L20 1574L36 1776L24 1920H0ZM1080 144L1046 156L1058 298L1042 474L1060 658L1046 860L1062 1084L1048 1320L1060 1574L1044 1776L1056 1920H1080Z",
        fill: "#d9c49b",
      },
      {
        path: "M66 160L238 144L242 184L70 200ZM834 1866L1006 1850L1010 1890L838 1906Z",
        fill: "#d9c49b",
      },
      ...Array.from({ length: 18 }, (_, index) => ({
        path: circle(46, 230 + index * 86, 5),
        fill: "#b79e76",
      })),
    ];
  if (theme === "coquette")
    return [
      {
        path: "M44 180Q44 148 76 148H1004Q1036 148 1036 180V1856Q1036 1888 1004 1888H76Q44 1888 44 1856Z",
        stroke: "#a65072",
        strokeWidth: 3,
      },
      ...Array.from({ length: 24 }, (_, index) => ({
        path: `M44 ${180 + index * 70}q-28 17 0 34M1036 ${180 + index * 70}q28 17 0 34`,
        stroke: "#d18aa6",
        strokeWidth: 3,
      })),
      {
        path: "M468 1882Q418 1824 410 1866Q412 1902 468 1882Q524 1902 526 1866Q518 1824 468 1882M468 1882L448 1916M468 1882L492 1916",
        stroke: "#a65072",
        strokeWidth: 4,
      },
    ];
  if (theme === "retro-rally")
    return [
      { path: "M20 148H34V1890H20ZM1046 148H1060V1890H1046Z", fill: "#683d32" },
      { path: "M42 148H54V1890H42ZM1026 148H1038V1890H1026Z", fill: "#b96236" },
      { path: "M64 148H1016M64 1888H1016", stroke: "#683d32", strokeWidth: 4 },
      ...Array.from({ length: 20 }, (_, index) => ({
        path: circle(82 + index * 48, 1908, 6),
        fill: "#683d32",
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
      fill: "#f4dfae",
      stroke: "#683d32",
      strokeWidth: 5,
    },
    { path: "M128 200H952V598H128Z", stroke: "#683d32", strokeWidth: 3 },
    { path: "M148 268H932V308H148ZM148 324H932V364H148Z", fill: "#b96236" },
    { path: "M148 420H932V460H148ZM148 476H932V516H148Z", fill: "#527562" },
    { path: "M396 218H684V580H396Z", fill: "#f4dfae" },
    ...Array.from({ length: 12 }, (_, index) => ({
      path: circle(164 + index * 68, 594, 5),
      fill: "#683d32",
    })),
    { path: "M360 218H720V578H360Z", stroke: "#683d32", strokeWidth: 3 },
    ...(subject === "result"
      ? pickleball(540, 398, 154, accent, "#f4dfae")
      : subject === "people"
        ? [
            ...paddle(362, 250, accent, "#683d32", 1.8),
            ...paddle(566, 250, "#df9851", "#683d32", 1.8),
          ]
        : [
            ...paddle(434, 226, accent, "#683d32", 2.2),
            ...pickleball(680, 509, 64, "#df9851", "#683d32"),
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
        path: `M${x + 8} ${y + 8}H${right - 8}V${bottom - 8}H${x + 8}Z`,
        stroke: "#d6c8a5",
        strokeWidth: 2,
      },
      {
        path: `M${x + 86} ${y + 4}l190 -12 2 28 -190 12ZM${right - 282} ${bottom - 32}l190 12 -2 28 -190 -12Z`,
        fill: "#dac398",
      },
      { path: `M${x + 34} ${bottom - 16}h76`, stroke: accent, strokeWidth: 5 },
      ...pickleball(right - 26, bottom - 20, 14, "#dcec69", "#263b35"),
    ];
  if (theme === "coquette")
    return [
      {
        path: `M${x + 14} ${y + 14}H${right - 14}V${bottom - 14}H${x + 14}Z`,
        stroke: "#a65072",
        strokeWidth: 3,
      },
      ...Array.from({ length: 11 }, (_, index) => ({
        path: `M${x + 60 + index * 76} ${bottom - 20}q18 20 36 0`,
        stroke: "#d18aa6",
        strokeWidth: 3,
      })),
      {
        path: `M${right - 108} ${y + 22}c-60 -38 -64 38 0 0c60 38 64 -38 0 0`,
        fill: accent,
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
