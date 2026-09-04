import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarSupportNav } from "./sidebar-support-nav";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("SidebarSupportNav", () => {
  beforeEach(() => usePathname.mockReturnValue("/help"));

  it("keeps only court suggestion, help, and feedback in the support area", () => {
    render(<SidebarSupportNav />);

    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href"))
    ).toEqual(["/courts/suggest", "/help", "/feedback"]);
    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("marks the court suggestion form as the current sidebar destination", () => {
    usePathname.mockReturnValue("/courts/suggest");
    render(<SidebarSupportNav />);
    expect(
      screen.getByRole("link", { name: "Suggest a court" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("keeps the admin console out of support navigation", () => {
    render(<SidebarSupportNav />);
    expect(
      screen.queryByRole("link", { name: "Admin console" })
    ).not.toBeInTheDocument();
  });
});
