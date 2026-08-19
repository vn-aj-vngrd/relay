import { describe, expect, it } from "vitest";

import { safeNextPath, sharedSessionSlug } from "./destination-path";

describe("post-auth destination", () => {
  it("accepts local destinations and rejects protocol-relative redirects", () => {
    expect(safeNextPath("/s/friends-night")).toBe("/s/friends-night");
    expect(safeNextPath("//malicious.example")).toBe("/home");
    expect(safeNextPath("https://malicious.example")).toBe("/home");
  });

  it("recognizes only a shared game root", () => {
    expect(sharedSessionSlug("/s/friends-night")).toBe("friends-night");
    expect(sharedSessionSlug("/s/friends-night/")).toBe("friends-night");
    expect(sharedSessionSlug("/s/friends-night/chat")).toBeNull();
  });
});
