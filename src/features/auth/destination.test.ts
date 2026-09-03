import { describe, expect, it } from "vitest";

import {
  onboardingDestination,
  postSetupDestination,
  safeNextPath,
  sharedSessionSlug,
} from "./destination-path";

describe("post-auth destination", () => {
  it("accepts local destinations and rejects protocol-relative redirects", () => {
    expect(safeNextPath("/s/friends-night")).toBe("/s/friends-night");
    expect(safeNextPath("//malicious.example")).toBe("/home");
    expect(safeNextPath("https://malicious.example")).toBe("/home");
  });

  it("takes a new player to game creation while preserving a selected court", () => {
    expect(onboardingDestination("/home", false)).toBe(
      "/onboarding?next=%2Fgames%2Fnew"
    );
    const game = "/games/new?venue=Central+Pickle&address=Cebu+City";
    expect(onboardingDestination(game, false)).toBe(
      "/onboarding?next=%2Fgames%2Fnew%3Fvenue%3DCentral%2BPickle%26address%3DCebu%2BCity"
    );
    expect(onboardingDestination(game, true)).toBe(game);
  });

  it("opens the tour and preserves the task that brought the player into Relay", () => {
    expect(postSetupDestination("/games/new")).toBe(
      "/home?tour=1&next=%2Fgames%2Fnew"
    );
    expect(postSetupDestination("/games/new?venue=Central+Pickle")).toBe(
      "/home?tour=1&next=%2Fgames%2Fnew%3Fvenue%3DCentral%2BPickle"
    );
    expect(
      postSetupDestination("/games/59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7")
    ).toBe("/home?tour=1&next=%2Fgames%2F59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7");
  });

  it("recognizes only a shared game root", () => {
    expect(sharedSessionSlug("/s/friends-night")).toBe("friends-night");
    expect(sharedSessionSlug("/s/friends-night/")).toBe("friends-night");
    expect(sharedSessionSlug("/s/friends-night/chat")).toBeNull();
  });
});
