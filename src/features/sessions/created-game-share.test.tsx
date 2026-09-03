import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  track: vi.fn().mockResolvedValue(undefined),
}));

vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: mocks.track,
}));

import { CreatedGameShare } from "./created-game-share";

const props = {
  sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  title: "Friends Night",
  shareUrl: "/s/friends-night",
  details: "Aug 22 · 7:00–9:00 PM · Central Pickle",
  inviteeCount: 2,
  qrEnabled: true,
};

beforeEach(() => {
  vi.clearAllMocks();
  window.history.replaceState(
    null,
    "",
    "/games/session-1?created=1&source=search"
  );
  Object.assign(navigator, { share: vi.fn().mockResolvedValue(undefined) });
});

afterEach(() => {
  window.history.replaceState(null, "", "/");
  vi.restoreAllMocks();
});

describe("CreatedGameShare", () => {
  it("shows the first-publish actions once and removes the temporary marker", async () => {
    render(<CreatedGameShare {...props} />);

    expect(screen.getByRole("heading", { name: "Game created" })).toBeVisible();
    expect(screen.getByText(/2 Relay players were invited/)).toBeVisible();
    expect(screen.getByRole("button", { name: "Share game" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Show QR" })).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Preview shared link" })
    ).toHaveAttribute("href", "/s/friends-night");
    await waitFor(() => expect(window.location.search).toBe("?source=search"));
  });

  it("does not encourage open sharing for a private game", () => {
    render(<CreatedGameShare {...props} qrEnabled={false} />);

    expect(
      screen.getByText(/Only invited Relay players can open this private game/)
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Share game" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show QR" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Invite players" })
    ).toHaveAttribute("href", `/games/${props.sessionId}/players`);
  });

  it("dismisses after a successful native share", async () => {
    render(<CreatedGameShare {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Share game" }));

    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Game created" })
      ).not.toBeInTheDocument()
    );
    expect(screen.getByText("Game shared")).toHaveClass("sr-only");
    expect(mocks.track).toHaveBeenCalledWith({
      sessionId: props.sessionId,
      event: "invite_shared",
    });
  });
});
