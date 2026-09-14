import { sessionAccents } from "@/features/sessions/accent";

export type StoryColor = {
  id: string;
  label: string;
  color: string;
  soft: string;
  light?: boolean;
};

export const babyPink = {
  id: "story:pink",
  label: "Baby Pink",
  color: "#ffe0eb",
  soft: "#ffe0eb",
  light: true,
} as const;

// Reuse game hues; the extra neutrals belong only to personal story artwork.
export const storyColors: readonly StoryColor[] = [
  ...sessionAccents.map((accent) => ({
    id: `accent:${accent.id}`,
    label: accent.label,
    color: accent.solid,
    soft: accent.soft,
  })),
  babyPink,
  {
    id: "story:cream",
    label: "Cream",
    color: "#f7efd9",
    soft: "#f7efd9",
    light: true,
  },
  { id: "story:ink", label: "Ink", color: "#20252b", soft: "#f1f2f3" },
];

export function storyColorsForGame(gameColorId: string) {
  const current =
    storyColors.find((color) => color.id === `accent:${gameColorId}`) ??
    storyColors[0];
  return [current, ...storyColors.filter((color) => color.id !== current.id)];
}
