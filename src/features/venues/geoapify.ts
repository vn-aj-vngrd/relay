import { z } from "zod";

export const venueSearchQuerySchema = z.string().trim().min(3).max(100);

const resultSchema = z.object({
  place_id: z.string().min(1),
  name: z.string().trim().optional(),
  address_line1: z.string().trim().optional(),
  address_line2: z.string().trim().optional(),
  formatted: z.string().trim().min(1),
  city: z.string().trim().optional(),
  state: z.string().trim().optional(),
  lat: z.number(),
  lon: z.number(),
});

const responseSchema = z.object({ results: z.array(resultSchema).default([]) });

export type VenueSuggestion = {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
};

export function parseGeoapifyResults(value: unknown): VenueSuggestion[] {
  const parsed = responseSchema.safeParse(value);
  if (!parsed.success) return [];

  const seen = new Set<string>();
  return parsed.data.results.flatMap((result) => {
    const name = result.name || result.address_line1 || result.formatted.split(",")[0]?.trim();
    if (!name || seen.has(result.place_id)) return [];
    seen.add(result.place_id);
    const address =
      result.formatted === name
        ? [result.address_line2, result.city, result.state].filter(Boolean).join(", ")
        : result.formatted.startsWith(`${name}, `)
          ? result.formatted.slice(name.length + 2)
          : result.formatted;
    return [{ id: result.place_id, name, address, latitude: result.lat, longitude: result.lon }];
  });
}
