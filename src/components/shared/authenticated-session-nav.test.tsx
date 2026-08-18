import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AuthenticatedSessionNav } from "./authenticated-session-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/games/session-1/chat" }));

describe("AuthenticatedSessionNav", () => {
  it("marks the current game destination from the route", () => {
    render(<AuthenticatedSessionNav id="session-1" />);
    expect(screen.getByRole("link", { name: "Chat" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Overview" })).not.toHaveAttribute("aria-current");
  });
});
