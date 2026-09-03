import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { MarketingSectionNav } from "./marketing-section-nav";

function section(id: string, documentTop: number) {
  return (
    <section
      id={id}
      ref={(element) => {
        if (!element) return;
        element.getBoundingClientRect = () =>
          ({
            top: documentTop - window.scrollY,
            left: 0,
            right: 0,
            bottom: 0,
            width: 0,
            height: 0,
          }) as DOMRect;
      }}
    />
  );
}

afterEach(() => vi.restoreAllMocks());

describe("MarketingSectionNav", () => {
  it("tracks the section currently under the header", async () => {
    Object.defineProperty(window, "scrollY", {
      configurable: true,
      writable: true,
      value: 0,
    });
    vi.spyOn(window, "requestAnimationFrame").mockImplementation((callback) =>
      window.setTimeout(() => callback(0), 0)
    );
    vi.spyOn(window, "cancelAnimationFrame").mockImplementation((id) =>
      window.clearTimeout(id)
    );
    render(
      <>
        {section("highlights", 500)}
        {section("court-finder", 1_000)}
        {section("plan", 1_500)}
        {section("play", 2_000)}
        {section("payments", 2_500)}
        {section("story", 3_000)}
        <MarketingSectionNav />
      </>
    );

    window.scrollY = 800;
    fireEvent.scroll(window);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Court" })).toHaveAttribute(
        "aria-current",
        "location"
      )
    );

    window.scrollY = 1_800;
    fireEvent.scroll(window);
    await waitFor(() =>
      expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute(
        "aria-current",
        "location"
      )
    );
  });
});
