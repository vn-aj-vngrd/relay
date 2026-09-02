import { fireEvent, render, screen } from "@testing-library/react";
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

  it("shows one current-section button before revealing mobile destinations", () => {
    render(<MobileAuthenticatedSessionNav id="session-1" />);

    const trigger = screen.getByRole("button", { name: "Game section, currently Chat" });
    expect(trigger).toHaveTextContent("Chat");
    expect(screen.queryByRole("menu", { name: "Game sections" })).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByRole("menu", { name: "Game sections" })).toBeVisible();
    expect(screen.getAllByRole("menuitem").map((item) => item.textContent)).toEqual([
      "Overview",
      "Players",
      "Play",
      "Chat",
      "Payments",
      "Story",
    ]);
    expect(screen.getByRole("menuitem", { name: "Chat" })).toHaveAttribute("aria-current", "page");
  });
});
