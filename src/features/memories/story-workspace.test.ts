import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  new URL("./story-workspace.module.css", import.meta.url),
  "utf8"
);

describe("Story workspace responsive layout contract", () => {
  it("keeps mobile centered and stacked with bounded desktop columns", () => {
    const mobile = stylesheet.match(/^\.workspace\s*\{([^}]+)\}/)?.[1];
    expect(mobile).toContain("max-width: 40rem");
    expect(mobile).toContain("margin-inline: auto");
    expect(mobile).not.toContain("grid-template-columns");

    const desktop = stylesheet.match(
      /@media \(min-width: 48rem\)\s*\{\s*\.workspace\s*\{([^}]+)\}/
    )?.[1];
    expect(desktop).toContain("max-width: 56rem");
    expect(desktop).toContain(
      "grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr)"
    );
  });
});
