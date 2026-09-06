// Canonical 1080×1920 bounds shared by expressive HTML and PNG.
// Relay composition insets, not official social-platform safe zones.
export const storyComposition = {
  headerTop: 48,
  headerBottom: 128,
  artTop: 136,
  artBottom: 348,
  factsTop: 384,
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
    description: "A statement ribbon, pearl lace, and blush paddles.",
  },
  {
    id: "court-pop",
    label: "Court Pop",
    description: "Bright court geometry, bold paddles, and a pickleball.",
  },
  {
    id: "retro-rally",
    label: "Retro Rally",
    description: "Vintage poster stripes and a court-club stamp.",
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
  ink: string
): Decoration[] {
  return [
    { path: `M${x + 32} ${y + 86}h24v68h-24Z`, fill: ink },
    {
      path: `M${x + 25} ${y}h38q25 0 25 26v50q0 27 -25 27h-38q-25 0 -25 -27v-50q0 -26 25 -26Z`,
      fill: color,
      stroke: ink,
      strokeWidth: 5,
    },
    {
      path: `M${x + 16} ${y + 26}h56M${x + 16} ${y + 35}h56`,
      stroke: ink,
      strokeWidth: 3,
    },
    {
      path: `M${x + 33} ${y + 119}l22 8M${x + 33} ${y + 134}l22 8`,
      stroke: color,
      strokeWidth: 3,
    },
  ];
}

function paperFrame(): Decoration[] {
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
    { path: "M438 1892L644 1898L638 1918L432 1912Z", fill: "#d9c49b" },
  ];
}

function scrapbook(): Decoration[] {
  return [
    ...paperFrame(),
    // A single stat-sheet construction connects the keepsake to its facts.
    { path: "M60 390H1020V1830H60Z", stroke: "#fff8e9", strokeWidth: 8 },
    {
      path: "M60 460V390H132M948 1830H1020V1760",
      stroke: "#d9c49b",
      strokeWidth: 14,
    },
    // Layered photo-paper panels form one masthead, not scattered stickers.
    { path: "M152 158L354 142L370 326L168 342Z", fill: "#d9c49b" },
    { path: "M174 148H356V334H174Z", fill: "#fff8e9" },
    { path: "M189 163H341V305H189Z", fill: "#477462" },
    { path: "M228 136L318 143L313 171L223 164Z", fill: "#d9c49b" },
    ...paddle(221, 172, "#f6d2be", "#263b35"),
    { path: "M422 186L879 170L884 303L427 319Z", fill: "#fff8e9" },
    {
      path: "M444 211L727 201M446 236L728 226M448 261L660 254",
      stroke: "#c9b99b",
      strokeWidth: 3,
    },
    { path: "M834 161L918 172L913 205L829 194Z", fill: "#d9c49b" },
    ...pickleball(808, 251, 39, "#d0dd81", "#477462"),
  ];
}

function coquette(): Decoration[] {
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
      path: "M60 460Q60 382 138 382H942Q1020 382 1020 460V1760Q1020 1830 942 1830H138Q60 1830 60 1760Z",
      stroke: "#a65072",
      strokeWidth: 3,
    },
    // Wide ribbon, folded tails and pearl edging leave the fact region clear.
    {
      path: "M386 204Q540 178 694 204L706 248Q540 226 374 248Z",
      fill: "#f2d5df",
    },
    {
      path: "M528 216L446 328L480 314L492 340L551 228M552 216L634 328L600 314L588 340L529 228",
      fill: "#e3a7bc",
      stroke: "#a65072",
      strokeWidth: 3,
    },
    {
      path: "M540 216C280 94 284 330 540 216C796 330 800 94 540 216Z",
      fill: "#f7dce7",
      stroke: "#a65072",
      strokeWidth: 5,
    },
    {
      path: "M535 215Q422 162 414 209M545 215Q658 162 666 209",
      stroke: "#d18aa6",
      strokeWidth: 4,
    },
    {
      path: "M525 198Q540 187 555 198L553 235Q540 246 527 235Z",
      fill: "#c97898",
    },
    ...Array.from({ length: 9 }, (_, index) => ({
      path: circle(396 + index * 36, 154, 4),
      fill: "#fff2f7",
    })),
    ...paddle(756, 174, "#f7dce7", "#a65072"),
  ];
}

function courtPop(): Decoration[] {
  return [
    { path: "M22 22H1058V1898H22Z", stroke: "#e1ee66", strokeWidth: 18 },
    { path: "M14 380H40V960H14ZM1040 1020H1066V1600H1040Z", fill: "#f79bbd" },
    { path: "M120 152H956V336H120Z", fill: "#dcec69" },
    {
      path: "M140 172H936V316H140ZM538 172V316M420 172V316M656 172V316M140 244H420M656 244H936",
      stroke: "#234f63",
      strokeWidth: 5,
    },
    ...pickleball(538, 245, 86, "#f79bbd", "#234f63"),
    { path: "M58 392V1830H1022", stroke: "#234f63", strokeWidth: 8 },
    { path: "M58 392H1018", stroke: "#dcec69", strokeWidth: 16 },
    {
      path: "M858 202l30 -12M864 227h35M858 252l30 12",
      stroke: "#234f63",
      strokeWidth: 6,
    },
  ];
}

function retroRally(): Decoration[] {
  return [
    { path: "M18 18H1062V1902H18Z", stroke: "#f4dfae", strokeWidth: 20 },
    { path: "M34 38H1046V1882H34Z", stroke: "#b96236", strokeWidth: 6 },
    { path: "M14 386H26V1760H14Z", fill: "#df9851" },
    { path: "M29 386H41V1760H29Z", fill: "#c56d46" },
    { path: "M44 386H56V1760H44Z", fill: "#f4dfae" },
    { path: "M1024 386H1036V1760H1024Z", fill: "#f4dfae" },
    { path: "M1039 386H1051V1760H1039Z", fill: "#c56d46" },
    { path: "M1054 386H1066V1760H1054Z", fill: "#df9851" },
    {
      path: "M132 148H948V336H132Z",
      fill: "#f4dfae",
      stroke: "#683d32",
      strokeWidth: 5,
    },
    { path: "M150 166H930V318H150Z", stroke: "#683d32", strokeWidth: 2 },
    {
      path: "M158 198H427V216H158ZM158 227H403V245H158ZM158 256H427V274H158Z",
      fill: "#b96236",
    },
    {
      path: "M653 198H922V216H653ZM677 227H922V245H677ZM653 256H922V274H653Z",
      fill: "#527562",
    },
    {
      path: circle(540, 242, 83),
      fill: "#527562",
      stroke: "#683d32",
      strokeWidth: 4,
    },
    ...paddle(496, 168, "#f4dfae", "#683d32"),
    {
      path: "M60 376H1020M60 1830H1020M60 1846H1020",
      stroke: "#683d32",
      strokeWidth: 4,
    },
  ];
}

// One 1080 × 1920 artwork definition feeds SVG and Canvas. Large motifs occupy
// the masthead band (y=130–348); poster content starts at y=384 in HTML and
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
