import { cleanup, render, screen, within } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";

import { getHelpArticle, helpCategories, legacyHelpLinks } from "./content";
import { HelpArticleContent } from "./help-article-content";
import { HelpCenterContent } from "./help-center-content";

afterEach(cleanup);

describe("Help Center reading surfaces", () => {
  it("leads with search, short beginner paths, and topics rather than the full library", () => {
    render(<HelpCenterContent />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    const starts = screen.getByRole("region", { name: "New to Relay?" });
    expect(
      within(starts).getByRole("link", { name: "Join your first game" })
    ).toHaveAttribute("href", "/help/player-start");
    expect(
      within(starts).getByRole("link", { name: "Host your first game" })
    ).toHaveAttribute("href", "/help/host-start");
    expect(
      within(starts).getByRole("link", { name: "Illustrated walkthrough" })
    ).toHaveAttribute("href", "/help/illustrated-game-cycle");
    expect(screen.getByRole("search")).toHaveAttribute("action", "/help");
    expect(
      screen.getByRole("searchbox", { name: "Search help articles" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Search" })).toHaveAttribute(
      "type",
      "submit"
    );
    const topics = screen.getByRole("navigation", { name: "Help topics" });
    expect(within(topics).getAllByRole("link")).toHaveLength(
      helpCategories.length
    );
    expect(
      screen.queryByRole("heading", {
        name: "Pay externally and submit payment proof",
      })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Contact support" })
    ).toHaveAttribute("href", "/help/support");
    expect(
      screen.getByRole("link", { name: "Replay app tour (account)" })
    ).toHaveAttribute("href", "/home?tour=1");
    for (const link of legacyHelpLinks) {
      const target = document.getElementById(link.id);
      expect(target?.querySelector("a")).toHaveAttribute(
        "href",
        `/help/${link.slug}`
      );
      expect(target?.closest("details")).not.toHaveAttribute("open");
    }
  });

  it("shows only the chosen category and keeps search scoped without repeating summaries", () => {
    render(<HelpCenterContent category="payments" />);
    const results = screen.getByRole("region", { name: "Payments" });
    expect(within(results).getAllByRole("heading", { level: 3 })).toHaveLength(
      3
    );
    expect(
      screen.getByRole("search").querySelector('[name="category"]')
    ).toHaveValue("payments");
    const article = getHelpArticle("payments");
    if (!article) throw new Error("Missing payment article");
    expect(
      within(results).queryByText(article.summary)
    ).not.toBeInTheDocument();
  });

  it("shows scoped search results and a no-results recovery", () => {
    const { rerender } = render(
      <HelpCenterContent query="proof" category="payments" />
    );
    const results = screen.getByRole("region", { name: "Results for “proof”" });
    expect(
      within(results).getByRole("link", {
        name: /Pay externally and submit payment proof/,
      })
    ).toHaveAttribute("href", "/help/payments");
    expect(
      within(results).queryByRole("heading", { name: "Steps" })
    ).not.toBeInTheDocument();
    rerender(<HelpCenterContent query="no-such-task-xyz" />);
    expect(screen.getByText(/No articles match/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Clear search and filters" })
    ).toHaveAttribute("href", "/help");
    expect(screen.getByRole("link", { name: "Contact support" })).toBeVisible();
  });

  it("keeps steps primary and all requirements, outcomes, and recovery text in native disclosures", () => {
    const article = getHelpArticle("guest-rsvp");
    if (!article) throw new Error("Missing guest guide");
    render(<HelpArticleContent article={article} />);
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(
      within(screen.getByRole("navigation", { name: "Breadcrumb" })).getByRole(
        "link",
        { name: "Help Center" }
      )
    ).toHaveAttribute("href", "/help");
    expect(
      screen.queryByRole("navigation", { name: "On this page" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("region", { name: "Steps" }).querySelectorAll("ol > li")
    ).toHaveLength(article.steps.length);
    for (const id of ["before-you-start", "outcome", "troubleshooting"]) {
      const disclosure = document.getElementById(id);
      expect(disclosure?.tagName).toBe("DETAILS");
      expect(disclosure?.querySelector("summary")).not.toBeNull();
      expect(disclosure).not.toHaveAttribute("open");
    }
    for (const text of [
      ...article.prerequisites,
      article.outcome,
      ...article.troubleshooting,
    ])
      expect(screen.getByText(text)).toBeInTheDocument();
    expect(
      screen.getByRole("link", {
        name: "Keep a guest response in your account",
      })
    ).toHaveAttribute("href", "/help/keep-guest-game");
    expect(
      screen.getByText(/Source-reviewed/).closest("details")
    ).not.toHaveAttribute("open");
    expect(
      screen.getByText("Email Relay support").closest("details")
    ).not.toHaveAttribute("open");
  });

  it("keeps screenshot figures beside their steps with full-size access", () => {
    const article = getHelpArticle("illustrated-game-cycle");
    if (!article) throw new Error("Missing illustrated guide");
    render(<HelpArticleContent article={article} />);
    for (const figure of article.figures ?? []) {
      const image = screen.getByRole("img", { name: figure.alt });
      expect(image.closest("li")).toHaveTextContent(
        article.steps[figure.afterStep - 1]
      );
      expect(image.closest("a")).toHaveAttribute("href", figure.src);
      expect(image.closest("figure")).toHaveTextContent(figure.caption);
    }
  });
});
