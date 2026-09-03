export const discoverySourceValues = [
  "friend",
  "group_chat",
  "social",
  "search",
  "other",
] as const;

export type DiscoverySource = (typeof discoverySourceValues)[number];

export const discoverySourceOptions: Array<{
  value: DiscoverySource;
  label: string;
}> = [
  { value: "friend", label: "A friend" },
  { value: "group_chat", label: "A group chat or shared game" },
  { value: "social", label: "Social media" },
  { value: "search", label: "Web search" },
  { value: "other", label: "Somewhere else" },
];

export function discoverySourceLabel(value?: string | null) {
  return (
    discoverySourceOptions.find((option) => option.value === value)?.label ??
    "Not answered"
  );
}
