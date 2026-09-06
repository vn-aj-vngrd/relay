import { z } from "zod";

export const gameLibraryFilterSchema = z.object({
  q: z.string().trim().max(200).default(""),
  collection: z.enum(["games", "invitations"]).default("games"),
  when: z.enum(["upcoming", "past", "all", "range"]).default("upcoming"),
  role: z.enum(["any", "player", "host", "cohost"]).default("any"),
  response: z
    .enum([
      "any",
      "invited",
      "going",
      "maybe",
      "pending",
      "waitlisted",
      "declined",
    ])
    .default("any"),
  group: z
    .union([z.literal("any"), z.literal("none"), z.uuid()])
    .default("any"),
  venue: z.string().max(300).default(""),
  cancelled: z.enum(["false", "true"]).default("false"),
  from: z
    .union([
      z.literal(""),
      z.iso
        .date()
        .refine(
          (value) => !value.startsWith("0000"),
          "Choose a year from 0001 to 9999."
        ),
    ])
    .default(""),
  until: z
    .union([
      z.literal(""),
      z.iso
        .date()
        .refine(
          (value) => !value.startsWith("0000"),
          "Choose a year from 0001 to 9999."
        ),
    ])
    .default(""),
});

export type GameLibraryFilters = z.infer<typeof gameLibraryFilterSchema>;
export const defaultGameLibraryFilters = gameLibraryFilterSchema.parse({});
export const gameLibraryFilterKeys = Object.keys(
  defaultGameLibraryFilters
) as (keyof GameLibraryFilters)[];
export type GameLibraryOptions = {
  groups: { value: string; label: string }[];
  venues: { value: string; label: string }[];
};

export function gameLibraryRangeError(filters: GameLibraryFilters) {
  if (filters.when !== "range") return null;
  if (!filters.from || !filters.until)
    return "Choose both a From and Until date.";
  if (filters.from > filters.until)
    return "Until date must be on or after From date.";
  return null;
}

export function parseGameLibraryFilters(params: {
  get: (key: string) => string | null;
}) {
  const values = Object.fromEntries(
    gameLibraryFilterKeys.flatMap((key) => {
      const value = params.get(key);
      return value === null ? [] : [[key, value]];
    })
  );
  // Preserve the existing Past bookmark; invitations remain a separate shortcut.
  if (!params.get("when") && params.get("filter") === "past")
    values.when = "past";
  return gameLibraryFilterSchema.safeParse(values);
}

export function gameLibrarySearchParams(filters: GameLibraryFilters) {
  const params = new URLSearchParams();
  for (const key of gameLibraryFilterKeys) {
    if (filters[key] !== defaultGameLibraryFilters[key])
      params.set(key, filters[key]);
  }
  return params;
}
