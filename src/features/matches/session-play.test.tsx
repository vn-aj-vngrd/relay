import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ completeSession: vi.fn() }));
vi.mock("@/features/memories/queries", () => ({
  getSessionRecapData: vi.fn(),
}));
vi.mock("@/features/memories/session-recap", () => ({
  SessionRecap: () => null,
}));
vi.mock("@/features/feedback/post-game-feedback", () => ({
  PostGameFeedback: () => null,
}));
vi.mock("./live-court", () => ({ LiveCourtDeck: () => null }));
vi.mock("./match-results", () => ({ MatchResults: () => null }));
vi.mock("./play-management-controls", () => ({
  CourtAvailabilityControl: () => null,
  MatchCancellationControl: () => null,
  QueueOrderControls: () => null,
}));
vi.mock("./start-rotation-form", () => ({ StartRotationForm: () => null }));
vi.mock("@/features/sessions/attendance-toggle", () => ({
  PlayAvailabilityControl: () => null,
}));

import { deriveLiveState } from "./live-state";
import { SessionPlay, type SessionPlayData } from "./session-play";

function data(status = "published") {
  return {
    session: {
      id: "game",
      status,
      cancellationReason: null,
    } as SessionPlayData["session"],
    play: deriveLiveState({
      rotationMode: "queue",
      queue: [],
      pairs: [],
      activeMatches: [],
      courtCount: 1,
      completedMatchCount: 0,
    }),
    roster: [],
    queue: [],
    courts: [],
    activeMatches: [],
    completedMatches: [],
    completedMatchCount: 0,
    pairs: [],
    standings: [],
  } satisfies SessionPlayData;
}

const viewer = {
  canManagePlay: false,
  canCompleteSession: false,
  canScoreAll: false,
  canScoreAssigned: false,
};

describe("pre-Play state", () => {
  it("describes the actual setup sequence and eligibility for organizers", async () => {
    render(
      await SessionPlay({
        data: data(),
        viewer: { ...viewer, canManagePlay: true },
        setupHref: "/games/game/play/setup",
        storyHref: "/games/game/story",
      })
    );
    expect(
      screen.getByText(
        "Confirm players and available courts, choose game options, then review and start Play."
      )
    ).toBeVisible();
    expect(
      screen.getByText(
        "Play needs at least four eligible players and one available court."
      )
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "Set up Play" })).toHaveAttribute(
      "href",
      "/games/game/play/setup"
    );
  });
  it.each(["/games/game", "/s/shared"])(
    "keeps player guidance mode-neutral on %s",
    async (hrefBase) => {
      render(
        await SessionPlay({
          data: data(),
          viewer,
          storyHref: `${hrefBase}/story`,
        })
      );
      expect(
        screen.getByText(
          "Courts, scores, and player rotations appear here after an organizer starts Play."
        )
      ).toBeVisible();
      expect(
        screen.queryByRole("link", { name: "Set up Play" })
      ).not.toBeInTheDocument();
      expect(screen.queryByText(/the queue/)).not.toBeInTheDocument();
    }
  );
  it("does not offer setup after cancellation", async () => {
    render(
      await SessionPlay({
        data: data("cancelled"),
        viewer: { ...viewer, canManagePlay: true },
        setupHref: "/games/game/play/setup",
        storyHref: "/games/game/story",
      })
    );
    expect(
      screen.getByRole("heading", { name: "This game was cancelled" })
    ).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Set up Play" })
    ).not.toBeInTheDocument();
  });
});
