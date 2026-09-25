import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  "src/features/agent/message.module.css",
  "utf8"
);

describe("Agent message action motion", () => {
  it("applies the fade in both directions only for fine pointers without reduced motion", () => {
    const motion = stylesheet.match(
      /@media \(hover: hover\) and \(pointer: fine\) and \(\s*prefers-reduced-motion: no-preference\s*\)\s*\{\s*\.actions\s*\{([^}]+)\}/
    );
    expect(motion?.[1]).toMatch(/transition:\s*opacity 180ms ease/);
    // The transition belongs to the row, not just its hovered state, so exit fades too.
    expect(stylesheet.match(/transition:/g)).toHaveLength(1);
  });

  it("keeps actions visible on touch and reveals them on keyboard focus without changing layout", () => {
    expect(stylesheet).toMatch(/^\.actions\s*\{\s*opacity: 1;/);
    expect(stylesheet).toMatch(
      /\.message:focus-within \.actions\s*\{\s*opacity: 1;/
    );
    expect(stylesheet).not.toMatch(/display:|visibility:|height:|transform:/);
  });
});
