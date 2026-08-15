import { describe, expect, it } from "vitest";
import { sessionSlug } from "./slug";

describe("session slugs", () => {
  it("keeps a readable title and adds an unguessable suffix", () => {
    expect(sessionSlug("Saturday Night Pickle!")).toMatch(/^saturday-night-pickle-[a-f0-9]{6}$/);
  });
  it("handles titles without Latin letters", () => expect(sessionSlug("🏓")).toMatch(/^game-[a-f0-9]{6}$/));
});
