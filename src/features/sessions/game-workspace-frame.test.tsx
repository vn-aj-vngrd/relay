import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const navigation = vi.hoisted(() => ({ pathname: "/games/session-1" }));

vi.mock("next/navigation", () => ({
  usePathname: () => navigation.pathname,
}));
vi.mock("@/components/shared/authenticated-session-nav", () => ({
  AuthenticatedSessionNav: () => <div>Desktop game tabs</div>,
  MobileAuthenticatedSessionNav: () => <div>Mobile game tabs</div>,
}));
vi.mock("./game-workspace-actions", () => ({
  GameWorkspaceActions: () => <div>Game actions</div>,
}));
vi.mock("@/features/matches/compact-play-status", () => ({
  CompactPlayStatus: () => <div>Play status</div>,
}));

import { GameWorkspaceFrame } from "./game-workspace-frame";

function renderFrame() {
  return render(
    <GameWorkspaceFrame
      sessionId="session-1"
      sessionTitle="Saturday Pickle"
      sessionSlug="saturday-pickle"
      canManage
      qrEnabled
      qrDetails="Saturday · 7 PM · Central Pickle"
      playStatus={{ label: "Court 1", urgent: true }}
    >
      <main>Route content</main>
    </GameWorkspaceFrame>
  );
}

beforeEach(() => {
  navigation.pathname = "/games/session-1";
});

afterEach(cleanup);

describe("GameWorkspaceFrame", () => {
  it("gives Game settings a focused route with a back button and no game tabs", () => {
    navigation.pathname = "/games/session-1/settings";
    renderFrame();

    expect(screen.getByRole("link", { name: "Back to game" })).toHaveAttribute(
      "href",
      "/games/session-1"
    );
    expect(screen.getByText("Game settings")).toBeVisible();
    expect(screen.queryByText("Desktop game tabs")).not.toBeInTheDocument();
    expect(screen.queryByText("Mobile game tabs")).not.toBeInTheDocument();
    expect(screen.queryByText("Game actions")).not.toBeInTheDocument();
    expect(screen.queryByText("Play status")).not.toBeInTheDocument();
  });

  it("keeps the standard game chrome on game workspace routes", () => {
    renderFrame();

    expect(screen.getByText("Desktop game tabs")).toBeInTheDocument();
    expect(screen.getByText("Mobile game tabs")).toBeInTheDocument();
    expect(screen.getAllByText("Game actions")).toHaveLength(2);
    expect(screen.getByText("Play status")).toBeInTheDocument();
  });
});
