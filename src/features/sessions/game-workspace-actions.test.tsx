import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { GameWorkspaceActions } from "./game-workspace-actions";

const props = {
  canManage: true,
  editHref: "/games/session-1/settings",
  shareUrl: "/s/friends-night",
  title: "Friends Night",
  sessionId: "session-1",
  qrEnabled: true,
  qrDetails: "Aug 22 · 7:00–9:00 PM · Central Pickle",
  mode: "mobile" as const,
};

describe("GameWorkspaceActions", () => {
  it("groups mobile actions behind one labeled disclosure button", () => {
    render(<GameWorkspaceActions {...props} />);

    const trigger = screen.getByRole("button", { name: "Game actions" });
    expect(trigger).toHaveClass("h-11", "w-11");
    expect(
      screen.queryByRole("link", { name: "Edit game" })
    ).not.toBeInTheDocument();

    fireEvent.click(trigger);

    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "Edit game" })).toHaveAttribute(
      "href",
      "/games/session-1/settings"
    );
    expect(screen.getByRole("button", { name: "Share game" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Show QR" })).toBeVisible();
  });

  it("does not offer edit access to players", () => {
    render(<GameWorkspaceActions {...props} canManage={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Game actions" }));

    expect(
      screen.queryByRole("link", { name: "Edit game" })
    ).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share game" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Show QR" })).toBeVisible();
  });

  it("hides QR sharing when private access would block onsite players", () => {
    render(<GameWorkspaceActions {...props} qrEnabled={false} />);
    fireEvent.click(screen.getByRole("button", { name: "Game actions" }));

    expect(
      screen.queryByRole("button", { name: "Show QR" })
    ).not.toBeInTheDocument();
  });

  it("keeps sharing direct and groups secondary desktop actions", () => {
    render(<GameWorkspaceActions {...props} mode="desktop" />);

    expect(screen.getByRole("button", { name: "Share game" })).toBeVisible();
    const more = screen.getByRole("button", { name: "More game actions" });
    fireEvent.click(more);

    expect(screen.getByRole("link", { name: "Edit game" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Show QR" })).toBeVisible();
  });
});
