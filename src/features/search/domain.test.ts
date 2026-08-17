import { describe, expect, it } from "vitest";
import { mergeRecentSearches, searchRequestSchema } from "./domain";

describe("global search input", () => {
  it("accepts a single keystroke and bounds pagination", () => {
    expect(searchRequestSchema.safeParse({ q: "v", type: "all", cursor: "0" }).success).toBe(true);
    expect(searchRequestSchema.safeParse({ q: "", type: "all" }).success).toBe(false);
    expect(searchRequestSchema.safeParse({ q: "van", type: "private-messages" }).success).toBe(false);
  });

  it("keeps recent searches useful and bounded", () => {
    const first = mergeRecentSearches([], { query: "  Central Pickle ", filter: "venues" }, 1);
    const replaced = mergeRecentSearches(first, { query: "central pickle", filter: "venues" }, 2);
    expect(replaced).toEqual([{ query: "central pickle", filter: "venues", savedAt: 2 }]);
    const many = Array.from({ length: 10 }, (_, index) => ({ query: `q${index}`, filter: "all" as const, savedAt: index }));
    expect(mergeRecentSearches(many, { query: "latest", filter: "players" }, 20)).toHaveLength(8);
  });
});
