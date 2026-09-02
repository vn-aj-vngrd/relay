import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameWorkspaceActions } from "./game-workspace-actions";

const props = {
  canManage: true,
  editHref: "/games/session-1/settings",
  shareUrl: "/s/friends-night",
  title: "Friends Night",
  sessionId: "session-1",
  mode: "mobile" as const,
};

describe("GameWorkspaceActions", () => {
  it("groups mobile actions behind one labeled menu button", () => {
    render(<GameWorkspaceActions {...props} />);

    const trigger = screen.getByRole("button", { name: "Game actions" });
    expect(trigger).toHaveClass("h-11", "w-11");
    expect(screen.queryByRole("menu")).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(screen.getByRole("menu", { name: "Game actions" })).toBeVisible();
    expect(screen.getByRole("menuitem", { name: "Edit game" })).toHaveAttribute("href", "/games/session-1/settings");
    expect(screen.getByRole("menuitem", { name: "Share game" })).toBeVisible();
  });

  it("does not offer edit access to players", () => {
    render(<GameWorkspaceActions {...props} canManage={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Game actions" }));

    expect(screen.queryByRole("menuitem", { name: "Edit game" })).not.toBeInTheDocument();
    expect(screen.getByRole("menuitem", { name: "Share game" })).toBeVisible();
  });

  it("keeps direct labeled actions on larger screens", () => {
    render(<GameWorkspaceActions {...props} mode="desktop" />);

    expect(screen.queryByRole("button", { name: "Game actions" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Edit game" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Share game" })).toBeVisible();
  });
});
