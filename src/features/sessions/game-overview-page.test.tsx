import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  getSessionForWorkspace: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  requireUser: async () => ({ id: "invitee", user_metadata: {} }),
}));
vi.mock("@/features/sessions/queries", () => mocks);
vi.mock("@/features/players/profile", () => ({
  ensureProfile: async () => ({ name: "Player", username: "player" }),
}));
vi.mock("@/features/sessions/actions", () => ({
  markSessionBookedAction: vi.fn(),
}));
vi.mock("@/features/sessions/overview", () => ({
  getSessionOverview: async () => ({ payment: { view: "none" } }),
}));
vi.mock("@/features/sessions/readiness-query", () => ({
  loadPlayReadiness: async () => ({ readiness: {} }),
}));
vi.mock("@/features/sessions/created-game-share", () => ({
  CreatedGameShare: () => null,
}));
vi.mock("@/features/sessions/session-summary", () => ({
  SessionHero: () => <h2>Ended game</h2>,
  SessionPlanDetails: () => null,
}));
vi.mock("@/features/sessions/session-overview", () => ({
  SessionAtAGlance: () => null,
}));
vi.mock("@/features/sessions/rsvp-control", () => ({
  RsvpControl: () => <button type="button">Update response</button>,
}));

import GameOverviewPage from "@/app/(app)/games/[id]/page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Game overview lifecycle", () => {
  it.each(["invited", "pending"])(
    "shows completed results rather than RSVP for a %s player",
    async (rsvp) => {
      mocks.getSessionForWorkspace.mockResolvedValue({
        session: {
          id: "game-1",
          slug: "ended-game",
          title: "Ended game",
          hostId: "host",
          status: "completed",
          startsAt: new Date("2099-09-10T07:00:00Z"),
          endsAt: new Date("2099-09-10T10:00:00Z"),
          timezone: "Asia/Manila",
          venueName: "Central Pickle",
          capacity: 16,
        },
        membership: { id: "player-1", role: "player", rsvp },
        access: rsvp,
        roster: [],
      });

      render(
        await GameOverviewPage({
          params: Promise.resolve({ id: "game-1" }),
          searchParams: Promise.resolve({}),
        })
      );

      expect(screen.getByRole("heading", { name: "Overview" })).toBeVisible();
      expect(screen.getAllByText("Game complete").length).toBeGreaterThan(0);
      expect(
        screen.getAllByRole("link", { name: "View recap" })[0]
      ).toHaveAttribute("href", "/games/game-1/play");
      expect(screen.getByRole("heading", { name: "Who played" })).toBeVisible();
      expect(screen.queryByText("Can you make it?")).not.toBeInTheDocument();
      expect(screen.queryByText("Awaiting approval")).not.toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Update response" })
      ).not.toBeInTheDocument();
    }
  );
});
