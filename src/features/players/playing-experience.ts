export const playingExperienceValues = [
  "new",
  "casual",
  "regular",
  "experienced",
] as const;
export type PlayingExperience = (typeof playingExperienceValues)[number];

export const playingExperienceOptions: ReadonlyArray<{
  value: PlayingExperience;
  label: string;
  description: string;
}> = [
  { value: "new", label: "Just starting", description: "Learning the basics" },
  { value: "casual", label: "Casual", description: "Plays now and then" },
  { value: "regular", label: "Regular", description: "Plays most weeks" },
  {
    value: "experienced",
    label: "Experienced",
    description: "Comfortable with pace and strategy",
  },
];

const weights: Record<PlayingExperience, number> = {
  new: 1,
  casual: 2,
  regular: 3,
  experienced: 4,
};

export function playingExperienceWeight(value: string | null | undefined) {
  return playingExperienceValues.includes(value as PlayingExperience)
    ? weights[value as PlayingExperience]
    : 2.5;
}

export function playingExperienceLabel(value: string | null | undefined) {
  return (
    playingExperienceOptions.find((option) => option.value === value)?.label ??
    "Not set"
  );
}
