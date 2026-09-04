import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { AppNav } from "./app-nav";

const navigationState = vi.hoisted(() => ({ pathname: "/home" }));
vi.mock("next/navigation", () => ({
  usePathname: () => navigationState.pathname,
}));

beforeEach(() => {
  navigationState.pathname = "/home";
});

describe("AppNav", () => {
  it("renders the theme-aware mobile bar with clear active and inactive states", () => {
    render(<AppNav mode="mobile" />);

    const navigation = screen.getByRole("navigation", {
      name: "Main navigation",
    });
    expect(navigation).toHaveClass("mobile-chrome");
    expect(screen.getByRole("link", { name: "Home" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    expect(screen.getByRole("link", { name: "Home" })).toHaveClass(
      "text-primary"
    );
    expect(screen.getByRole("link", { name: "Games" })).toHaveClass(
      "text-muted"
    );
    expect(screen.getByRole("link", { name: "Courts" })).toHaveAttribute(
      "href",
      "/courts"
    );
    expect(screen.getByRole("link", { name: "Courts" })).toHaveAttribute(
      "data-tour",
      "courts"
    );
    expect(
      screen.queryByRole("link", { name: "Profile" })
    ).not.toBeInTheDocument();
  });

  it("shows waiting invites on the Games destination", () => {
    render(<AppNav mode="mobile" invitationCount={3} />);

    expect(
      screen.getByRole("link", { name: "Games, 3 invites" })
    ).toHaveTextContent("3");
  });

  it("places notifications below groups in the desktop main navigation", () => {
    render(<AppNav mode="sidebar" unreadCount={12} />);

    const links = screen.getAllByRole("link");
    expect(links.map((link) => link.getAttribute("href"))).toEqual([
      "/home",
      "/games",
      "/groups",
      "/notifications",
    ]);
    expect(
      screen.getByRole("link", { name: "Notifications, 12 unread" })
    ).toHaveAttribute("href", "/notifications");
    expect(screen.getByLabelText("12 unread notifications")).toBeVisible();
  });

  it("keeps notifications out of the mobile bottom navigation", () => {
    render(<AppNav mode="mobile" unreadCount={12} />);

    expect(
      screen.queryByRole("link", { name: "Notifications, 12 unread" })
    ).not.toBeInTheDocument();
  });

  it("removes global mobile navigation inside a focused game workspace", () => {
    navigationState.pathname = "/games/game-1/chat";

    render(<AppNav mode="mobile" />);

    expect(
      screen.queryByRole("navigation", { name: "Main navigation" })
    ).not.toBeInTheDocument();
  });
});
