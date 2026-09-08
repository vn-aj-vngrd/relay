import { type StoryTheme, storyComposition } from "./story-theme";

export type StoryPhotoRole = "background" | "foreground";
export type StoryPhotoPlacement = "top" | "center" | "bottom";
export type StoryRegion = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export const babyPink = {
  id: "story:pink",
  label: "Baby Pink",
  color: "#ffe0eb",
  light: true,
} as const;
const region = (y: number, height: number): StoryRegion => ({
  x: 72,
  y,
  width: 936,
  height,
});

/** Canonical export pixels, never viewport pixels. Photo crop is independent. */
export function storyScene(
  theme: StoryTheme,
  hasPhoto: boolean,
  role: StoryPhotoRole = "background",
  placement: StoryPhotoPlacement = "center",
  fitCompleteContent = false,
  allocation?: { bottom: number; factsHeight?: number; headingHeight?: number }
) {
  const framed = hasPhoto && role === "foreground";
  let art = region(
    storyComposition.artTop,
    storyComposition.artBottom - storyComposition.artTop
  );
  let facts = region(
    storyComposition.factsTop,
    storyComposition.factsBottom - storyComposition.factsTop
  );
  let photo: StoryRegion = { x: 0, y: 0, width: 1080, height: 1920 };
  const bottom = Math.min(1810, allocation?.bottom ?? 1810);
  const headingHeight = allocation?.headingHeight ?? 0;
  let heading: StoryRegion | null = null;
  if (framed) {
    // Reclaim Center's former 280px dead zone. Framed scenes allocate against
    // the footer directly, never through a whole-scene scale.
    const top = 160;
    const gap = 32;
    const available = bottom - top;
    const factsHeight =
      allocation?.factsHeight ?? Math.min(778, available * 0.48);
    const headingSpace = headingHeight
      ? headingHeight + gap
      : placement === "center"
        ? 80
        : 0;
    const photoHeight = Math.min(
      840,
      available - factsHeight - gap - headingSpace
    );
    if (placement === "bottom") {
      facts = region(top, factsHeight);
      photo = region(bottom - photoHeight, photoHeight);
    } else {
      if (headingHeight) heading = region(top, headingHeight);
      // Center reads title → photograph → practical details. Recap Center
      // balances spare space above its photograph without starving the facts.
      const spare = available - photoHeight - factsHeight - gap - headingSpace;
      photo = region(
        top + headingSpace + (placement === "center" ? spare / 2 : 0),
        photoHeight
      );
      facts = region(photo.y + photo.height + gap, factsHeight);
    }
    // With a real photo, the art becomes its surround, not a second picture.
    art = photo;
  }
  if (!framed && (fitCompleteContent || allocation)) {
    const top =
      theme === "minimal" && fitCompleteContent
        ? 160
        : storyComposition.factsTop;
    facts = region(top, bottom - top);
  }
  const frame = framed ? photo : null;
  const leftInset = theme === "minimal" ? 20 : 116;
  const inset = theme === "minimal" ? 20 : 40;
  return {
    framed,
    heading,
    art,
    facts,
    frame,
    photo: framed
      ? {
          x: photo.x + leftInset,
          y: photo.y + inset,
          width: photo.width - leftInset - inset,
          height: photo.height - inset * 2,
        }
      : photo,
    fitFacts: fitCompleteContent || framed || theme !== "minimal",
  };
}

export function storyRegionStyle(box: StoryRegion) {
  return {
    left: `${box.x / 10.8}%`,
    top: `${box.y / 19.2}%`,
    width: `${box.width / 10.8}%`,
    height: `${box.height / 19.2}%`,
  };
}

/** Uniform art scaling preserves paddle and ball proportions in every slot. */
export function storyArtTransform(box: StoryRegion) {
  const scale = Math.min(box.width / 936, box.height / 480);
  return {
    scale,
    x: box.x + (box.width - 936 * scale) / 2 - 72 * scale,
    y: box.y + (box.height - 480 * scale) / 2 - 160 * scale,
  };
}
