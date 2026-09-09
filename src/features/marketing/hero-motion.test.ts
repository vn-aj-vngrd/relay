import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8"
);

const heroSelector = '.marketing-reveal-ready[data-marketing-reveal="hero"]';
const reducedMotionStart = stylesheet.lastIndexOf(
  "@media (prefers-reduced-motion: reduce)"
);

describe("Hero entrance motion contract", () => {
  it("pauses before a pronounced smooth rise without nested stagger", () => {
    const start = stylesheet.split(`${heroSelector} {`)[1]?.split("}")[0];
    expect(start).toContain("opacity: 0");
    expect(start).toContain("translate3d(0, 80px, 0)");
    expect(start).toContain("clip-path: none");
    expect(start).toContain("transition: none");
    expect(start).not.toContain("transition-delay");

    const entrance = stylesheet
      .split(
        '.marketing-reveal-ready.marketing-reveal-visible[data-marketing-reveal="hero"] {'
      )[1]
      ?.split("}")[0];
    expect(entrance).toContain("opacity: 1");
    expect(entrance).toContain("transform: none");
    expect(entrance).toContain("opacity 240ms ease-out");
    expect(entrance).toContain(
      "transform 700ms cubic-bezier(0.22, 1, 0.36, 1)"
    );
    expect(entrance).not.toContain("scale(");
    expect(entrance).toContain("transition-delay: 240ms");

    const normalMotion = stylesheet.slice(0, reducedMotionStart);
    expect(normalMotion).not.toMatch(
      /\[data-marketing-reveal="hero"\]\s+\[data-marketing-part/
    );
  });

  it("explicitly overrides hero specificity for reduced motion", () => {
    const reducedMotion = stylesheet.slice(reducedMotionStart);
    expect(reducedMotion).toContain(`${heroSelector},`);
    expect(reducedMotion).toContain("transform: none");
    expect(reducedMotion).toContain("opacity: 1");
    expect(reducedMotion).toContain("transition-delay: 0ms !important");
  });
});
