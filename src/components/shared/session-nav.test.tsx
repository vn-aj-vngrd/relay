import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionNav } from "./session-nav";

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

  it("keeps every destination directly reachable in a mobile chip rail", () => {
    render(<SessionNav id="session-1" embedded active="Overview" />);

    expect(screen.getByRole("group", { name: "Game navigation" })).toHaveClass("min-w-max", "gap-2");
    const activeTab = screen.getByRole("link", { name: "Overview" });
    expect(activeTab).toHaveClass(
      "min-h-9",
      "rounded-full",
      "border",
      "border-primary/20",
      "bg-primary-soft",
      "text-primary-hover",
    );
    expect(screen.getByRole("link", { name: "Players" })).toHaveClass("border-line", "bg-surface");
    expect(screen.queryByRole("button", { name: "More" })).not.toBeInTheDocument();
  });

  it("centers the active chip without changing the page’s vertical scroll position", () => {
    const scrollTo = vi.fn();
    const scrollIntoView = vi.fn();
    Object.defineProperty(HTMLElement.prototype, "scrollTo", { configurable: true, value: scrollTo });
    Object.defineProperty(HTMLElement.prototype, "scrollIntoView", { configurable: true, value: scrollIntoView });

    render(<SessionNav id="session-1" embedded active="Chat" />);

    expect(scrollTo).toHaveBeenCalledWith(expect.objectContaining({ behavior: "auto", left: expect.any(Number) }));
    expect(scrollIntoView).not.toHaveBeenCalled();

    Reflect.deleteProperty(HTMLElement.prototype, "scrollTo");
    Reflect.deleteProperty(HTMLElement.prototype, "scrollIntoView");
  });

  it("keeps the social Story separate from Play and its completed recap", () => {
    render(<SessionNav id="session-1" active="Story" />);
    expect(screen.getByRole("link", { name: "Play" })).toHaveAttribute("href", "/games/session-1/play");
    expect(screen.getByRole("link", { name: "Story" })).toHaveAttribute("href", "/games/session-1/story");
    expect(screen.getByRole("link", { name: "Story" })).toHaveAttribute("aria-current", "page");
  });
});
