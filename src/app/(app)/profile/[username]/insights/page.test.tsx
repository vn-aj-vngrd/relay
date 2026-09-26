import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  findProfile: vi.fn(),
  getInsights: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({
  requireUser: async () => ({ id: "viewer" }),
}));
vi.mock("@/db/client", () => ({
  db: { query: { profiles: { findFirst: mocks.findProfile } } },
}));
vi.mock("@/features/players/insights", () => ({
  getPlayerInsights: mocks.getInsights,
}));
vi.mock("next/navigation", () => ({
  notFound: () => {
    throw new Error("NOT_FOUND");
  },
}));

import PlayerInsightsPage from "./page";

beforeEach(() => vi.clearAllMocks());
afterEach(cleanup);

describe("personal insights access", () => {
  it("does not read another player's detailed record", async () => {
    mocks.findProfile.mockResolvedValueOnce({
      userId: "someone-else",
      username: "someone-else",
    });

    await expect(
      PlayerInsightsPage({
        params: Promise.resolve({ username: "someone-else" }),
      })
    ).rejects.toThrow("NOT_FOUND");
    expect(mocks.getInsights).not.toHaveBeenCalled();
  });

  it("shows the owner's saved record and links to a recent game", async () => {
    mocks.findProfile.mockResolvedValueOnce({
      userId: "viewer",
      username: "my-profile",
    });
    mocks.getInsights.mockResolvedValueOnce({
      hostedGames: 2,
      gamesPlayed: 1,
      matchesPlayed: 3,
      wins: 2,
      losses: 1,
      winRate: 67,
      pointsFor: 31,
      pointsAgainst: 24,
      recentGames: [
        {
          id: "game-1",
          title: "Friday doubles",
          startsAt: new Date("2026-09-25T10:00:00Z"),
          timezone: "Asia/Manila",
          matches: 3,
          wins: 2,
          losses: 1,
          canOpen: true,
        },
      ],
    });

    render(
      await PlayerInsightsPage({
        params: Promise.resolve({ username: "my-profile" }),
      })
    );

    expect(
      screen.getAllByRole("heading", { name: "Your game insights" })
    ).toHaveLength(2);
    expect(
      screen.getByRole("link", { name: "Back to profile" })
    ).toHaveAttribute("href", "/profile/my-profile");
    expect(screen.getByText("67%")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Friday doubles/ })
    ).toHaveAttribute("href", "/games/game-1/play");
    expect(mocks.getInsights).toHaveBeenCalledWith("viewer");
  });

  it("shows a departed player's result without an inaccessible game link", async () => {
    mocks.findProfile.mockResolvedValueOnce({
      userId: "viewer",
      username: "my-profile",
    });
    mocks.getInsights.mockResolvedValueOnce({
      hostedGames: 0,
      gamesPlayed: 1,
      matchesPlayed: 1,
      wins: 1,
      losses: 0,
      winRate: 100,
      pointsFor: 11,
      pointsAgainst: 8,
      recentGames: [
        {
          id: "game-2",
          title: "Past game",
          startsAt: new Date("2026-09-25T10:00:00Z"),
          timezone: "Asia/Manila",
          matches: 1,
          wins: 1,
          losses: 0,
          canOpen: false,
        },
      ],
    });

    render(
      await PlayerInsightsPage({
        params: Promise.resolve({ username: "my-profile" }),
      })
    );

    expect(screen.getByText("Past game")).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Past game/ })).toBeNull();
  });
});
