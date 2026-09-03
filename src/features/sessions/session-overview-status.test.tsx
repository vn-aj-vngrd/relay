import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionOverviewStatus } from "./session-overview-status";

const readiness = { ready: true, percent: 100, completed: 3, total: 3, missing: [] };
const base = {
  sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  estimatedCostCents: null,
  readiness,
};

describe("SessionOverviewStatus", () => {
  it("replaces setup guidance with the saved recap after completion", () => {
    render(<SessionOverviewStatus {...base} status="completed" isHost />);

    expect(screen.getByText("Game complete")).toBeVisible();
    expect(screen.getByRole("heading", { name: "Results are saved" })).toBeVisible();
    expect(screen.getByRole("link", { name: "View recap" })).toHaveAttribute("href", `/games/${base.sessionId}/play`);
    expect(screen.queryByText("Ready to play")).not.toBeInTheDocument();
    expect(screen.queryByText("You manage this game")).not.toBeInTheDocument();
  });

  it("keeps host setup guidance before the game ends", () => {
    render(<SessionOverviewStatus {...base} status="published" isHost />);

    expect(screen.getByText("Host access")).toBeVisible();
    expect(screen.getByText("You manage this game")).toBeVisible();
    expect(screen.getByText("Ready to play")).toBeVisible();
    expect(screen.getByRole("link", { name: /Set up Play/ })).toBeVisible();
  });
});
