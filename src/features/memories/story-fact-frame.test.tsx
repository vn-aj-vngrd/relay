import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { StoryFactFrame } from "./story-fact-frame";

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("StoryFactFrame", () => {
  it("drops fitted positioning when switching back to a natural layout", () => {
    vi.spyOn(HTMLElement.prototype, "clientHeight", "get").mockReturnValue(300);
    vi.spyOn(HTMLElement.prototype, "scrollHeight", "get").mockReturnValue(100);
    const disconnect = vi.fn();
    vi.stubGlobal(
      "ResizeObserver",
      class {
        observe() {}
        disconnect = disconnect;
      }
    );
    const props = {
      bounds: { x: 72, y: 1032, width: 936, height: 778 },
      position: "bottom" as const,
      className: "absolute inset-x-0 bottom-0",
      children: (
        <div>
          <p>Our kind of game.</p>
        </div>
      ),
    };
    const { container, rerender } = render(
      <StoryFactFrame {...props} enabled />
    );
    const fitted = container.querySelector<HTMLElement>(
      "[data-story-fitted-content]"
    )!;
    expect(fitted.style.transform).toBe("translateY(200px) scale(1)");

    rerender(<StoryFactFrame {...props} enabled={false} />);
    expect(
      screen.getByText("Our kind of game.").parentElement?.style.transform
    ).toBe("");
    expect(container.querySelector("[data-story-fitted-content]")).toBeNull();
    expect(fitted.style.transform).toBe("");
    expect(disconnect).toHaveBeenCalled();

    rerender(<StoryFactFrame {...props} enabled />);
    expect(
      container.querySelector<HTMLElement>("[data-story-fitted-content]")?.style
        .transform
    ).toBe("translateY(200px) scale(1)");
  });
});
