import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { SidebarUtilityNav } from "./sidebar-utility-nav";

vi.mock("next/navigation", () => ({ usePathname: () => "/games/new" }));

describe("SidebarUtilityNav", () => {
  it("uses concise labels and exposes the current quick action", () => {
    render(<SidebarUtilityNav />);

    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Search" })).not.toHaveAttribute("aria-current");
    expect(screen.queryByText("Create game")).not.toBeInTheDocument();
  });
});
