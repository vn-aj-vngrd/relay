import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { AppNav } from "./app-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/home" }));

describe("AppNav", () => {
  it("renders the theme-aware mobile bar with clear active and inactive states", () => {
    render(<AppNav mode="mobile" />);

    const navigation = screen.getByRole("navigation", { name: "Main navigation" });
    expect(navigation).toHaveClass("mobile-chrome");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass("text-primary");
    expect(screen.getByRole("link", { name: "Games" })).toHaveClass("text-muted");
    expect(screen.getByRole("link", { name: "Court" })).toHaveAttribute("href", "/venues");
    expect(screen.queryByRole("link", { name: "Profile" })).not.toBeInTheDocument();
  });
});
