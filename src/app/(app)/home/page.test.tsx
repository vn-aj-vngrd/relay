import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  requireUser: vi.fn(),
  ensureProfile: vi.fn(),
  getHomeSessions: vi.fn(),
}));

vi.mock("@/features/auth/session", () => ({ requireUser: mocks.requireUser }));
vi.mock("@/features/sessions/home-invitations", () => ({
  HomeInvitations: () => null,
}));
vi.mock("@/features/players/profile", () => ({
  ensureProfile: mocks.ensureProfile,
}));
vi.mock("@/features/sessions/queries", () => ({
  getHomeSessions: mocks.getHomeSessions,
}));

import HomePage from "./page";

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe("Home game insights entry", () => {
  it("links to the signed-in player's insights even without recent games", async () => {
    const user = { id: "player-1" };
    mocks.requireUser.mockResolvedValue(user);
    mocks.ensureProfile.mockResolvedValue({
      name: "Alex Player",
      username: "alex-player",
    });
    mocks.getHomeSessions.mockResolvedValue({
      invitations: [],
      primary: null,
      upcoming: [],
      recent: [],
    });

    render(await HomePage());

    expect(mocks.ensureProfile).toHaveBeenCalledWith(user);
    expect(mocks.getHomeSessions).toHaveBeenCalledWith(user.id);
    const insightsLink = screen.getByRole("link", {
      name: "View game insights",
    });
    expect(insightsLink).toHaveAttribute(
      "href",
      "/profile/alex-player/insights"
    );
    expect(insightsLink.parentElement).toHaveClass("hidden", "lg:block");
  });
});
