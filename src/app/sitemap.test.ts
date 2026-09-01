import { describe, expect, it, vi } from "vitest";

import sitemap from "./sitemap";

vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({ NEXT_PUBLIC_APP_URL: "https://relay.example" }),
}));

vi.mock("@/features/venues/directory", () => ({
  getCourtListings: vi.fn().mockResolvedValue([{ slug: "nice-serve" }, { slug: "makati-pickleball-club" }]),
}));

describe("sitemap", () => {
  it("includes public product routes and every verified court detail page", async () => {
    const entries = await sitemap();

    expect(entries).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ url: "https://relay.example" }),
        expect.objectContaining({ url: "https://relay.example/courts" }),
        expect.objectContaining({ url: "https://relay.example/courts/nice-serve" }),
        expect.objectContaining({ url: "https://relay.example/courts/makati-pickleball-club" }),
        expect.objectContaining({ url: "https://relay.example/play" }),
      ]),
    );
  });
});
