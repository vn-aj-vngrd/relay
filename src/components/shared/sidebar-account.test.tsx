import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SidebarAccount } from "./sidebar-account";

vi.mock("@/features/auth/actions", () => ({ signOut: vi.fn() }));

describe("SidebarAccount", () => {
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
