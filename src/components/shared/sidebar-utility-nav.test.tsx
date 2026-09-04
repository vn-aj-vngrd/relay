import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarUtilityNav } from "./sidebar-utility-nav";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("SidebarUtilityNav", () => {
  beforeEach(() => usePathname.mockReturnValue("/games/new"));

  it("uses concise labels and exposes the current quick action", () => {
    render(<SidebarUtilityNav />);

    expect(screen.getByRole("link", { name: "Create" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Search" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(screen.getByRole("link", { name: "Courts" })).toHaveAttribute(
      "href",
      "/courts"
    );
    expect(screen.getByRole("link", { name: "Courts" })).not.toHaveAttribute(
      "aria-current"
    );
    expect(screen.getByRole("link", { name: "Quick Play" })).toHaveAttribute(
      "href",
      "/play"
    );
    expect(screen.queryByText("Create game")).not.toBeInTheDocument();
  });

  it("does not mark Courts current on the separate suggestion destination", () => {
    usePathname.mockReturnValue("/courts/suggest");
    render(<SidebarUtilityNav />);
    expect(screen.getByRole("link", { name: "Courts" })).not.toHaveAttribute(
      "aria-current"
    );
  });
});
