import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  track: vi.fn().mockResolvedValue(undefined),
  dismiss: vi.fn(),
}));

vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: mocks.track,
}));

vi.mock("./actions", () => ({
  dismissCreatedGameShare: mocks.dismiss,
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
  mocks.dismiss.mockResolvedValue({ success: true });
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
  it("shows the publish actions and removes only the temporary marker", async () => {
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

  it("stays visible after a successful native share", async () => {
    render(<CreatedGameShare {...props} />);

    fireEvent.click(screen.getByRole("button", { name: "Share game" }));

    expect(await screen.findByText("Game shared")).toHaveClass("sr-only");
    expect(screen.getByRole("heading", { name: "Game created" })).toBeVisible();
    expect(mocks.dismiss).not.toHaveBeenCalled();
    expect(mocks.track).toHaveBeenCalledWith({
      sessionId: props.sessionId,
      event: "invite_shared",
    });
  });

  it("remains visible when remounted after the URL marker is removed", () => {
    const { unmount } = render(<CreatedGameShare {...props} />);
    expect(window.location.search).toBe("?source=search");
    unmount();
    render(<CreatedGameShare {...props} />);
    expect(screen.getByRole("heading", { name: "Game created" })).toBeVisible();
  });

  it("persists an explicit dismissal for this game before hiding", async () => {
    render(<CreatedGameShare {...props} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss game created message" })
    );
    await waitFor(() => expect(mocks.dismiss).toHaveBeenCalledOnce());
    expect(mocks.dismiss.mock.calls[0][1].get("sessionId")).toBe(
      props.sessionId
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Game created" })
      ).not.toBeInTheDocument()
    );
  });

  it("keeps the banner available when dismissal fails and allows retry", async () => {
    mocks.dismiss.mockResolvedValueOnce({
      error: "Couldn’t dismiss this message. Try again.",
    });
    render(<CreatedGameShare {...props} />);
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss game created message" })
    );
    expect(await screen.findByRole("alert")).toHaveTextContent("Try again");
    expect(screen.getByRole("heading", { name: "Game created" })).toBeVisible();
    fireEvent.click(
      screen.getByRole("button", { name: "Dismiss game created message" })
    );
    await waitFor(() =>
      expect(
        screen.queryByRole("heading", { name: "Game created" })
      ).not.toBeInTheDocument()
    );
  });
});
