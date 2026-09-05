import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";

import {
  getHelpArticle,
  helpArticles,
  helpCategories,
  legacyHelpLinks,
  searchHelpArticles,
} from "./content";

const slugPattern = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

describe("Help Center article contract", () => {
  it("keeps complete, uniquely linkable, source-owned articles in valid categories", () => {
    expect(new Set(helpArticles.map((article) => article.slug)).size).toBe(
      helpArticles.length
    );
    for (const article of helpArticles) {
      expect(article.slug).toMatch(slugPattern);
      expect(
        helpCategories.some((category) => category.id === article.category)
      ).toBe(true);
      for (const value of [
        article.title,
        article.summary,
        article.audience,
        article.outcome,
      ])
        expect(value.trim()).not.toBe("");
      for (const values of [
        article.prerequisites,
        article.steps,
        article.troubleshooting,
        article.related,
        article.sources,
      ])
        expect(values.length).toBeGreaterThan(0);
      for (const slug of article.related) {
        expect(
          getHelpArticle(slug),
          `${article.slug} links to ${slug}`
        ).toBeDefined();
        expect(slug).not.toBe(article.slug);
      }
      for (const source of article.sources)
        expect(existsSync(source), source).toBe(true);
      if (article.action) expect(article.action.href).toMatch(/^(\/|mailto:)/);
      for (const figure of article.figures ?? []) {
        expect(figure.afterStep).toBeGreaterThan(0);
        expect(figure.afterStep).toBeLessThanOrEqual(article.steps.length);
        expect(figure.alt.length).toBeGreaterThan(0);
        expect(figure.caption.length).toBeGreaterThan(0);
        expect(existsSync(`public${figure.src}`)).toBe(true);
        expect(figure.width).toBeGreaterThan(0);
        expect(figure.height).toBeGreaterThan(0);
      }
    }
    for (const category of helpCategories)
      expect(
        helpArticles.some((article) => article.category === category.id)
      ).toBe(true);
  });

  it("covers both beginner paths, all five modes, and recovery boundaries", () => {
    for (const slug of [
      "player-start",
      "host-start",
      "quick-play",
      "paddle-stack",
      "mix-it-up",
      "balanced-mix",
      "court-climb",
      "team-round-robin",
      "keep-guest-game",
      "resume-draft",
      "game-access",
      "public-discovery",
      "live-recovery",
      "review-proof",
      "privacy",
      "support",
    ]) {
      expect(getHelpArticle(slug), slug).toBeDefined();
    }
    expect(getHelpArticle("not-an-article")).toBeUndefined();
  });

  it("preserves every old manual and FAQ fragment as an article link", () => {
    expect(legacyHelpLinks.map((link) => link.id)).toEqual([
      "find-a-court",
      "create-a-game",
      "payments",
      "choose-a-play-mode",
      "run-live-play",
      "play-mode-reference",
      "quick-answers",
      "getting-started",
      "invites-and-players",
      "chat-and-notifications",
      "play-and-scores",
      "privacy-and-history",
    ]);
    for (const link of legacyHelpLinks)
      expect(getHelpArticle(link.slug)).toBeDefined();
  });

  it("searches task text, prerequisites, outcomes, troubleshooting, and modes case-insensitively", () => {
    expect(
      searchHelpArticles("  PAYMENT   PROOF ").map((article) => article.slug)
    ).toContain("payments");
    expect(
      searchHelpArticles("cookie").map((article) => article.slug)
    ).toContain("keep-guest-game");
    expect(
      searchHelpArticles("Paddle Stack").map((article) => article.slug)
    ).toContain("paddle-stack");
    expect(
      searchHelpArticles("", "account").every(
        (article) => article.category === "account"
      )
    ).toBe(true);
    expect(searchHelpArticles("  ")).toHaveLength(helpArticles.length);
    expect(searchHelpArticles("no-such-task-xyz")).toEqual([]);
  });
});
