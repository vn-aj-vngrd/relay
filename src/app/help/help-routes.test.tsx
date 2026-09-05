import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("HELP_NOT_FOUND");
  },
}));
vi.mock("@/features/auth/session", () => ({
  requireUser: () => {
    throw new Error("Help must not require authentication");
  },
  getCurrentUser: () => {
    throw new Error("Help must not need an account query");
  },
}));
vi.mock("@/features/venues/directory", () => ({
  getCourtListings: () => {
    throw new Error("Help must not need directory data");
  },
}));

import HelpArticlePage, { generateMetadata } from "./[slug]/page";
import HelpPage from "./page";

describe("public Help routes", () => {
  it("opens help without account or directory data and handles repeated query parameters", async () => {
    const result = await HelpPage({
      searchParams: Promise.resolve({
        q: ["guest", "proof"],
        category: ["joining"],
      }),
    });
    expect(result.props.query).toBe("");
    expect(result.props.category).toBeUndefined();
  });

  it("resolves article content and canonical metadata without an account", async () => {
    const props = { params: Promise.resolve({ slug: "guest-rsvp" }) };
    expect((await HelpArticlePage(props)).props.article.slug).toBe(
      "guest-rsvp"
    );
    expect((await generateMetadata(props)).alternates?.canonical).toBe(
      "/help/guest-rsvp"
    );
  });

  it("returns not-found for an unknown article", async () => {
    await expect(
      HelpArticlePage({ params: Promise.resolve({ slug: "not-real" }) })
    ).rejects.toThrow("HELP_NOT_FOUND");
  });
});
