import { describe, expect, it } from "vitest";
import { helpArticles } from "@/features/help/content";
import { readAgentHelp, searchAgentHelp } from "./help";

describe("Agent Help Center source", () => {
  it.each(["create a game", "create game"])(
    "returns the direct guide before the broader Agent creation guide for %s",
    (query) => {
      const [result] = searchAgentHelp(query);
      expect(result.slug).toBe("create-a-game");
      expect(result.article).toEqual(readAgentHelp("create-a-game"));
    }
  );
  it("includes one safe authoritative guide without expanding every search result", () => {
    const results = searchAgentHelp("game");
    expect(results.length).toBeGreaterThan(1);
    expect(results[0].article).toEqual(readAgentHelp(results[0].slug));
    expect(results[0].article).toHaveProperty("steps");
    expect(results[0].article).not.toHaveProperty("sources");
    expect(results[0].article).not.toHaveProperty("figures");
    expect(results.slice(1).every((result) => !("article" in result))).toBe(
      true
    );
    expect(results.length).toBeLessThanOrEqual(8);
    expect(searchAgentHelp("nonexistent-private-manual")).toEqual([]);
    expect(searchAgentHelp("").every((result) => !("article" in result))).toBe(
      true
    );
  });
  it("returns current article instructions and excludes internal source paths", () => {
    const article = helpArticles[0];
    const result = readAgentHelp(article.slug);
    expect(result).toMatchObject({
      title: article.title,
      steps: article.steps,
      href: `/help/${article.slug}`,
    });
    expect(result).not.toHaveProperty("sources");
    expect(result).not.toHaveProperty("figures");
  });
  it("supports game/group discovery without inventing missing articles", () => {
    expect(searchAgentHelp("game").length).toBeGreaterThan(0);
    expect(searchAgentHelp("group").length).toBeGreaterThan(0);
    expect(readAgentHelp("nonexistent-private-manual")).toEqual({
      unavailable: true,
    });
  });
});
