import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarSupportNav } from "./sidebar-support-nav";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("SidebarSupportNav", () => {
  beforeEach(() => usePathname.mockReturnValue("/help"));

  it("keeps notifications and Help Center at the bottom", () => {
    render(<SidebarSupportNav />);

    expect(
      screen.getAllByRole("link").map((link) => link.getAttribute("href"))
    ).toEqual(["/notifications", "/help"]);
    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  });

  it("preserves the notification unread count and active state", () => {
    usePathname.mockReturnValue("/notifications");
    render(<SidebarSupportNav unreadCount={12} />);
    expect(screen.getByLabelText("12 unread notifications")).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Notifications, 12 unread" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("keeps the admin console out of support navigation", () => {
    render(<SidebarSupportNav />);
    expect(
      screen.queryByRole("link", { name: "Admin console" })
    ).not.toBeInTheDocument();
  });
});
