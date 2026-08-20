import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { visibleSessionTabCount } from "./responsive-session-tabs";
import { SessionNav } from "./session-nav";

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("SessionNav", () => {
  it("matches the shared-link information architecture", () => {
    render(<SessionNav id="59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7" active="Payments" />);
    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Overview",
      "Players",
      "Play",
      "Chat",
      "Payments",
      "Story",
    ]);
    expect(screen.getByRole("link", { name: "Payments" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute(
      "href",
      "/games/59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7/play",
    );
  });

  it("uses the public navigation spacing without adding a hidden spacer", () => {
    const { container } = render(<SessionNav id="session-1" embedded />);
    expect(screen.getByRole("list")).toHaveClass("px-1", "sm:px-0");
    expect(container.querySelector("span[aria-hidden]")).toHaveClass("absolute");
  });

  it("moves tabs that no longer fit into an accessible More menu", () => {
    const widths: Record<string, number> = {
      Overview: 77,
      Players: 67,
      Play: 49,
      Chat: 52,
      Payments: 82,
      Story: 55,
      More: 63,
    };
    vi.spyOn(HTMLElement.prototype, "clientWidth", "get").mockReturnValue(320);
    vi.spyOn(HTMLElement.prototype, "getBoundingClientRect").mockImplementation(function (this: HTMLElement) {
      const width = widths[this.textContent?.trim() ?? ""] ?? 0;
      return { width, height: 44, x: 0, y: 0, top: 0, right: width, bottom: 44, left: 0, toJSON: () => ({}) };
    });
    vi.stubGlobal(
      "ResizeObserver",
      class {
        constructor(private readonly callback: ResizeObserverCallback) {}
        observe() {
          this.callback([], this as unknown as ResizeObserver);
        }
        disconnect() {}
        unobserve() {}
      },
    );

    render(<SessionNav id="session-1" embedded />);

    expect(screen.getAllByRole("link").map((link) => link.textContent)).toEqual([
      "Overview",
      "Players",
      "Play",
      "Chat",
    ]);
    fireEvent.click(screen.getByRole("button", { name: "More" }));
    expect(screen.getAllByRole("menuitem").map((link) => link.textContent)).toEqual(["Payments", "Story"]);
  });

  it("calculates the responsive cutoff while reserving room for More", () => {
    const widths = [77, 67, 49, 52, 82, 55];
    expect(visibleSessionTabCount(390, widths, 63, 8)).toBe(6);
    expect(visibleSessionTabCount(320, widths, 63, 8)).toBe(4);
  });

  it("keeps the social Story separate from Play and its completed recap", () => {
    render(<SessionNav id="session-1" active="Story" />);
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/games/session-1/play");
    expect(screen.getByRole("link", { name: "Story" })).toHaveAttribute("href", "/games/session-1/story");
    expect(screen.getByRole("link", { name: "Story" })).toHaveAttribute("aria-current", "page");
  });
});
