import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarAccount } from "./sidebar-account";

vi.mock("@/features/auth/actions", () => ({ signOut: vi.fn() }));

describe("SidebarAccount", () => {
  it("shows the effective plan below the name and exposes the contextual upgrade link", () => {
    render(
      <SidebarAccount
        name="Host"
        username="host"
        plan={{ name: "Plus", action: "Upgrade plan" }}
      />
    );
    expect(screen.getByText("Plus plan")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Upgrade plan" })).toHaveAttribute(
      "href",
      "/settings/plan?section=plans"
    );
  });
  it("shows Unlimited privately without an upgrade prompt", () => {
    render(
      <SidebarAccount
        name="Internal host"
        username="internal"
        plan={{ name: "Unlimited", action: "Plan & billing" }}
      />
    );
    expect(screen.getByText("Unlimited plan")).toBeInTheDocument();
    expect(
      screen.queryByRole("link", { name: "Upgrade plan" })
    ).not.toBeInTheDocument();
    fireEvent.click(
      screen.getByRole("button", {
        name: "Open account menu for Internal host",
      })
    );
    expect(
      screen.getByRole("menuitem", { name: "Plan & billing" })
    ).toHaveAttribute("href", "/settings/plan");
  });
  it("keeps the admin console in the profile menu for admins", () => {
    render(<SidebarAccount name="Admin Player" username="admin" isAdmin />);
    fireEvent.click(
      screen.getByRole("button", { name: "Open account menu for Admin Player" })
    );
    expect(
      screen.getByRole("menuitem", { name: "Admin console" })
    ).toHaveAttribute("href", "/admin");
  });

  it("does not expose the admin console to other players", () => {
    render(<SidebarAccount name="Player" username="player" />);
    fireEvent.click(
      screen.getByRole("button", { name: "Open account menu for Player" })
    );
    expect(
      screen.queryByRole("menuitem", { name: "Admin console" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Settings" })).toHaveAttribute(
      "href",
      "/settings"
    );
  });
});
