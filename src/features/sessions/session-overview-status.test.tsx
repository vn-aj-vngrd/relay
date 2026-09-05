import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { SessionOverviewStatus } from "./session-overview-status";

const readiness = {
  ready: true,
  percent: 100,
  completed: 3,
  total: 3,
  missing: [],
};
const base = {
  sessionId: "59c6fa3f-3f6f-45f2-bbea-b85bc90aa3a7",
  payment: { view: "none", canManage: false } as const,
  readiness,
};

describe("SessionOverviewStatus", () => {
  it("replaces setup guidance with the saved recap after completion", () => {
    render(
      <SessionOverviewStatus {...base} status="completed" isHost canReplay />
    );

    expect(screen.getByText("Game complete")).toBeVisible();
    expect(
      screen.getByRole("heading", { name: "Results are saved" })
    ).toBeVisible();
    expect(screen.getByRole("link", { name: "View recap" })).toHaveAttribute(
      "href",
      `/games/${base.sessionId}/play`
    );
    expect(screen.getByRole("link", { name: "Play again" })).toHaveAttribute(
      "href",
      `/games/new?from=${base.sessionId}`
    );
    expect(screen.queryByText("Ready to play")).not.toBeInTheDocument();
    expect(screen.queryByText("You manage this game")).not.toBeInTheDocument();
  });

  it("keeps host setup guidance before the game ends", () => {
    render(<SessionOverviewStatus {...base} status="published" isHost />);

    expect(screen.getByText("Host access")).toBeVisible();
    expect(screen.getByText("You manage this game")).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Set up Play/ })).toHaveAttribute(
      "href",
      `/games/${base.sessionId}/play/setup`
    );
  });

  it("opens the live court directly once Play starts", () => {
    render(
      <SessionOverviewStatus
        {...base}
        status="live"
        isHost
        readiness={{
          ready: false,
          percent: 67,
          completed: 2,
          total: 3,
          missing: ["booking"],
        }}
      />
    );
    expect(screen.getByRole("heading", { name: "Play is live" })).toBeVisible();
    expect(screen.queryByRole("progressbar")).not.toBeInTheDocument();
    expect(screen.queryByText("67%")).not.toBeInTheDocument();
    expect(screen.queryByText(/Finish the game setup/)).not.toBeInTheDocument();

    expect(screen.getByRole("link", { name: /Open Play/ })).toHaveAttribute(
      "href",
      `/games/${base.sessionId}/play`
    );
  });

  it("does not turn a player price into a payment request", () => {
    render(
      <SessionOverviewStatus
        {...base}
        status="published"
        isHost={false}
        rsvp="going"
      />
    );

    expect(screen.getByText("You’re confirmed for this game.")).toBeVisible();
    expect(
      screen.queryByRole("link", { name: /payment/i })
    ).not.toBeInTheDocument();
  });

  it("shows the authoritative amount when a player payment is due", () => {
    render(
      <SessionOverviewStatus
        {...base}
        status="published"
        isHost={false}
        rsvp="going"
        payment={{
          view: "player",
          amountCents: 29900,
          status: "unpaid",
          reviewRequested: false,
        }}
      />
    );

    expect(
      screen.getByRole("link", { name: "View payment · ₱299 due" })
    ).toHaveAttribute("href", `/games/${base.sessionId}/payments`);
  });
});
