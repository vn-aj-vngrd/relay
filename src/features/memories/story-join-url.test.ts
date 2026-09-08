import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/env", () => ({
  getPublicEnv: () => ({
    NEXT_PUBLIC_APP_URL: "https://relay.example/base?token=never#auth",
  }),
}));

import { storyJoinUrl } from "./story-join-url";

const session = {
  visibility: "public" as const,
  status: "published",
  slug: "saturday-night-123abc",
};

describe("Story join eligibility", () => {
  it.each(["public", "link"] as const)(
    "uses only the canonical shared destination for %s games",
    (visibility) => {
      expect(storyJoinUrl({ ...session, visibility })).toBe(
        "https://relay.example/s/saturday-night-123abc"
      );
    }
  );
  it("excludes private games without consulting RSVP or discovery eligibility", () => {
    expect(storyJoinUrl({ ...session, visibility: "private" })).toBeNull();
  });
  it.each(["draft", "live", "completed", "cancelled"])(
    "does not invite players from %s stories",
    (status) => {
      expect(storyJoinUrl({ ...session, status })).toBeNull();
    }
  );
  it("does not let a slug inject a query, fragment or route", () => {
    const url = new URL(
      storyJoinUrl({
        ...session,
        slug: "game?guest=secret#auth/next",
      }) as string
    );
    expect(url.search).toBe("");
    expect(url.hash).toBe("");
    expect(url.pathname).toBe("/s/game%3Fguest%3Dsecret%23auth%2Fnext");
    expect(storyJoinUrl({ ...session, slug: "" })).toBeNull();
  });
});
