import { z } from "zod";

export const searchFilters = ["all", "games", "players", "groups", "venues"] as const;
export type SearchFilter = (typeof searchFilters)[number];

export const searchRequestSchema = z.object({
  q: z.string().trim().min(1).max(80),
  type: z.enum(searchFilters).default("all"),
  cursor: z.coerce.number().int().min(0).max(10_000).default(0),
});

export type SearchResult = {
  id: string;
  type: Exclude<SearchFilter, "all">;
  title: string;
  subtitle: string;
  href: string;
  accentColor?: string;
  imageUrl?: string | null;
};

export type SearchResponse = {
  items: SearchResult[];
  nextCursor: number | null;
};

export type RecentSearch = { query: string; filter: SearchFilter; savedAt: number };

export function mergeRecentSearches(current: RecentSearch[], next: Omit<RecentSearch, "savedAt">, now = Date.now()): RecentSearch[] {
  const normalized = next.query.trim();
  if (!normalized) return current;
  return [{ query: normalized, filter: next.filter, savedAt: now }, ...current.filter((item) => item.query.toLocaleLowerCase() !== normalized.toLocaleLowerCase() || item.filter !== next.filter)].slice(0, 8);
}
