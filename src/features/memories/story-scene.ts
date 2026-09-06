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
  placement: StoryPhotoPlacement = "center"
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
  if (framed) {
    if (placement === "top") {
      photo = region(160, 840);
      facts = region(1032, 778);
    } else if (placement === "center") {
      photo = region(440, 840);
      facts = region(1312, 498);
    } else {
      facts = region(160, 778);
      photo = region(970, 840);
    }
    // With a real photo, the art becomes its surround, not a second picture.
    art = photo;
  }
  const frame = framed ? photo : null;
  const leftInset = theme === "minimal" ? 20 : 116;
  const inset = theme === "minimal" ? 20 : 40;
  return {
    framed,
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
    fitFacts: framed || theme !== "minimal",
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
