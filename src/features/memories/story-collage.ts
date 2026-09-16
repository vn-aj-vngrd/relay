import type { StoryRegion } from "./story-scene";

export type StoryPhotoCrop = { x: number; y: number; zoom: number };
export type StoryCollageLayout =
  | "editorial"
  | "grid"
  | "callouts"
  | "scrapbook"
  | "camera";

export const storyCollageLayouts: Array<{
  value: StoryCollageLayout;
  label: string;
}> = [
  { value: "editorial", label: "Hero + moments" },
  { value: "grid", label: "Contact sheet" },
  { value: "callouts", label: "Photo callouts" },
  { value: "scrapbook", label: "Star scrapbook" },
  { value: "camera", label: "Camera roll" },
];
export type StorySelectedPhoto = {
  id: string;
  label: string;
  imageUrl: string;
  file?: File;
  crop: StoryPhotoCrop;
};

export const defaultPhotoCrop: StoryPhotoCrop = { x: 50, y: 50, zoom: 1 };
export const storyPhotoLimit = 4;

/** Shared canonical pixels for both preview and export. Never drops a photo. */
export function storyPhotoSlots(
  box: StoryRegion,
  count: number,
  layout: StoryCollageLayout = "editorial"
): StoryRegion[] {
  if (count <= 0) return [];
  if (count === 1) return [box];
  if (layout === "camera") {
    return storyPhotoSlots(box, count, "grid").map((frame) => ({
      x: frame.x + frame.width * 0.055,
      y: frame.y + frame.height * 0.12,
      width: frame.width * 0.73,
      height: frame.height * 0.76,
    }));
  }
  if (layout === "callouts" || layout === "scrapbook") {
    const heroWidth = box.width * 0.54;
    const detailHeight = box.height * (count === 2 ? 0.58 : 0.8 / (count - 1));
    const step = box.height / (count - 1);
    return [
      {
        ...box,
        y: box.y + box.height * 0.04,
        width: heroWidth,
        height: box.height * 0.92,
      },
      ...Array.from({ length: count - 1 }, (_, index) => ({
        x: box.x + box.width * 0.65,
        y: box.y + index * step + (step - detailHeight) / 2,
        width: box.width * 0.32,
        height: detailHeight,
      })),
    ];
  }
  const gap = 16;
  const halfWidth = (box.width - gap) / 2;
  const halfHeight = (box.height - gap) / 2;
  if (count === 2) {
    return layout === "editorial"
      ? [
          { ...box, width: halfWidth },
          { ...box, x: box.x + halfWidth + gap, width: halfWidth },
        ]
      : [
          { ...box, height: halfHeight },
          { ...box, y: box.y + halfHeight + gap, height: halfHeight },
        ];
  }
  if (layout === "grid" && count === 4) {
    return Array.from({ length: 4 }, (_, index) => ({
      x: box.x + (index % 2) * (halfWidth + gap),
      y: box.y + Math.floor(index / 2) * (halfHeight + gap),
      width: halfWidth,
      height: halfHeight,
    }));
  }
  if (layout === "grid") {
    return [
      { ...box, height: halfHeight },
      {
        x: box.x,
        y: box.y + halfHeight + gap,
        width: halfWidth,
        height: halfHeight,
      },
      {
        x: box.x + halfWidth + gap,
        y: box.y + halfHeight + gap,
        width: halfWidth,
        height: halfHeight,
      },
    ];
  }
  const heroWidth = (box.width - gap) * 0.62;
  const detailHeight = (box.height - gap * (count - 2)) / (count - 1);
  return [
    { ...box, width: heroWidth },
    ...Array.from({ length: count - 1 }, (_, index) => ({
      x: box.x + heroWidth + gap,
      y: box.y + index * (detailHeight + gap),
      width: box.width - heroWidth - gap,
      height: detailHeight,
    })),
  ];
}

export function storyPhotoGeometry(
  width: number,
  height: number,
  box: StoryRegion,
  crop: StoryPhotoCrop
) {
  const scale = Math.max(box.width / width, box.height / height) * crop.zoom;
  const drawWidth = width * scale;
  const drawHeight = height * scale;
  return {
    x: box.x - ((drawWidth - box.width) * crop.x) / 100,
    y: box.y - ((drawHeight - box.height) * crop.y) / 100,
    width: drawWidth,
    height: drawHeight,
  };
}

/** Vector overlays use the same paths in the DOM preview and canvas export. */
export function storyCollageDecorations(
  box: StoryRegion,
  count: number,
  layout: StoryCollageLayout,
  accent: string
): Array<{
  path: string;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
}> {
  if (count < 2 || layout === "editorial" || layout === "grid") return [];
  const slots = storyPhotoSlots(box, count, layout);
  const rect = (slot: StoryRegion) =>
    `M${slot.x} ${slot.y}h${slot.width}v${slot.height}h-${slot.width}Z`;
  if (layout === "camera") {
    return storyPhotoSlots(box, count, "grid").flatMap((frame, index) => {
      const slot = slots[index];
      const cx = frame.x + frame.width * 0.89;
      const cy = frame.y + frame.height * 0.53;
      const radius = Math.min(frame.width, frame.height) * 0.065;
      return [
        // Opposite winding leaves the photograph's screen unobscured.
        {
          path: `${rect(frame)} M${slot.x} ${slot.y}v${slot.height}h${slot.width}v-${slot.height}Z`,
          fill: index % 2 ? accent : "#c9cbd0",
        },
        { path: rect(slot), stroke: "#252830", strokeWidth: 8 },
        {
          path: `M${cx - radius} ${cy}a${radius} ${radius} 0 1 0 ${radius * 2} 0a${radius} ${radius} 0 1 0 -${radius * 2} 0`,
          fill: "#f5f3ee",
          stroke: "#252830",
          strokeWidth: 3,
        },
        {
          path: `M${cx - radius} ${frame.y + frame.height * 0.23}h${radius * 2}`,
          stroke: "#252830",
          strokeWidth: 6,
        },
        {
          path: `M${cx - radius} ${frame.y + frame.height * 0.8}h${radius * 2}`,
          stroke: "#252830",
          strokeWidth: 4,
        },
      ];
    });
  }
  const frames = slots.map((slot) => ({
    path: rect(slot),
    stroke: layout === "callouts" ? "#e9f47b" : "#fff8f0",
    strokeWidth: 6,
  }));
  if (layout === "callouts") {
    const hero = slots[0];
    return [
      ...frames,
      ...slots.slice(1).map((slot) => {
        const startX = hero.x + hero.width;
        const y = slot.y + slot.height / 2;
        return {
          path: `M${startX} ${y - 24}L${startX + (slot.x - startX) / 2} ${y - 24}L${slot.x} ${y}`,
          stroke: "#e9f47b",
          strokeWidth: 4,
        };
      }),
    ];
  }
  const stars = slots.slice(1, 2).map((slot, index) => {
    const cx = slot.x + (index % 2 ? slot.width : 0);
    const cy = slot.y + (index % 2 ? slot.height : 0);
    const radius = Math.min(box.width * 0.05, slot.height * 0.18);
    const points = Array.from({ length: 10 }, (_, point) => {
      const angle = -Math.PI / 2 + (point * Math.PI) / 5;
      const r = point % 2 ? radius * 0.45 : radius;
      return `${cx + Math.cos(angle) * r} ${cy + Math.sin(angle) * r}`;
    });
    return {
      path: `M${points.join("L")}Z`,
      fill: accent,
      stroke: "#fff8f0",
      strokeWidth: 4,
    };
  });
  return [...frames, ...stars];
}
