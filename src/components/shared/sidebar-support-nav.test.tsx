import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SidebarSupportNav } from "./sidebar-support-nav";

const usePathname = vi.fn();
vi.mock("next/navigation", () => ({ usePathname: () => usePathname() }));

describe("SidebarSupportNav", () => {
  beforeEach(() => usePathname.mockReturnValue("/help"));

  it("shows the active support page and a useful unread count", () => {
    render(<SidebarSupportNav unreadCount={12} />);
    expect(
      screen.getByRole("link", { name: "Notifications, 12 unread" })
    ).toHaveAttribute("href", "/notifications");
    expect(screen.getByLabelText("12 unread notifications")).toBeVisible();
    expect(screen.getByRole("link", { name: "Help Center" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Send feedback" })).toHaveAttribute(
      "href",
      "/feedback"
    );
    expect(
      screen.getByRole("link", { name: "Suggest a court" })
    ).toHaveAttribute("href", "/courts/suggest");
  });

  it("marks the court suggestion form as the current sidebar destination", () => {
    usePathname.mockReturnValue("/courts/suggest");
    render(<SidebarSupportNav unreadCount={0} />);
    expect(
      screen.getByRole("link", { name: "Suggest a court" })
    ).toHaveAttribute("aria-current", "page");
  });

  it("keeps the admin console out of support navigation", () => {
    render(<SidebarSupportNav unreadCount={0} />);
    expect(
      screen.queryByRole("link", { name: "Admin console" })
    ).not.toBeInTheDocument();
  });
});
