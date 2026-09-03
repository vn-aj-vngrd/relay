import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { activeTab, AuthenticatedSessionNav, MobileAuthenticatedSessionNav } from "./authenticated-session-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/games/session-1/chat" }));

describe("AuthenticatedSessionNav", () => {
  it("keeps setup inside the Play tab", () => {
    expect(activeTab("/games/session-1/play/setup")).toBe("Play");
  });

  it("marks the current game destination from the route", () => {
    render(<AuthenticatedSessionNav id="session-1" />);
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });

  it("keeps every destination directly reachable in the mobile rail", () => {
    render(<MobileAuthenticatedSessionNav id="session-1" />);

    expect(screen.getAllByRole("link").map((item) => item.textContent)).toEqual([
      "Overview",
      "Players",
      "Play",
      "Chat",
      "Payments",
      "Story",
    ]);
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(screen.queryByRole("button", { name: /Game section/ })).not.toBeInTheDocument();
  });
});
