import { describe, expect, it } from "vitest";

import manifest from "./manifest";

describe("PWA manifest", () => {
  it("is installable with standard and maskable icons", () => {
    const value = manifest();
    expect(value.display).toBe("standalone");
    expect(value.start_url).toBe("/home?source=pwa");
    expect(value.icons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ sizes: "192x192", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "any" }),
        expect.objectContaining({ sizes: "512x512", purpose: "maskable" }),
      ])
    );
    expect(value.shortcuts?.map((shortcut) => shortcut.short_name)).toEqual([
      "Create",
      "Games",
      "Court",
    ]);
    expect(
      value.shortcuts?.find((shortcut) => shortcut.short_name === "Court")?.url
    ).toBe("/court?source=pwa-shortcut");
  });
});
