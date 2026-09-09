import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const stylesheet = readFileSync(
  new URL("../../app/globals.css", import.meta.url),
  "utf8"
);
const page = readFileSync(
  new URL("../../app/(marketing)/page.tsx", import.meta.url),
  "utf8"
);

function rule(selector: string) {
  return stylesheet.split(`${selector} {`)[1]?.split("}")[0];
}

describe("Hero entrance motion contract", () => {
  it("holds the hidden pose from first paint without waiting for hydration", () => {
    const entrance = rule(".marketing-hero-product");
    expect(entrance).toContain(
      "marketing-hero-rise 700ms cubic-bezier(0.22, 1, 0.36, 1) 240ms backwards"
    );
    expect(entrance).toContain(
      "marketing-hero-fade 240ms ease-out 240ms backwards"
    );
    expect(rule("@keyframes marketing-hero-rise")).toContain(
      "transform: translate3d(0, 80px, 0)"
    );
    expect(rule("@keyframes marketing-hero-fade")).toContain("opacity: 0");
  });

  it("keeps the server-rendered hero outside the hydration reveal controller", () => {
    const hero = page.match(/<div\s+id="product"[^>]*>/)?.[0];
    expect(hero).toContain("marketing-hero-product");
    expect(hero).not.toContain("data-marketing-reveal");
  });

  it("skips the entrance for reduced motion and keyboard focus", () => {
    const reducedMotion = stylesheet.slice(
      stylesheet.lastIndexOf("@media (prefers-reduced-motion: reduce)")
    );
    const heroReset = reducedMotion
      .split(".marketing-hero-product,")[1]
      ?.split("}")[0];
    expect(heroReset).toContain("animation: none");
    expect(heroReset).toContain("transform: none");
    expect(heroReset).toContain("opacity: 1");
    expect(rule(".marketing-hero-product:focus-within")).toContain(
      "animation: none"
    );
  });
});
