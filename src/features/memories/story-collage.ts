import type { StoryRegion } from "./story-scene";

export type StoryPhotoCrop = { x: number; y: number; zoom: number };
export type StoryCollageLayout = "editorial" | "grid";
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
