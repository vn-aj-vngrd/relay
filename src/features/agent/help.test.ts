import { describe, expect, it } from "vitest";
import { helpArticles } from "@/features/help/content";
import { readAgentHelp, searchAgentHelp } from "./help";

describe("Agent Help Center source", () => {
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
