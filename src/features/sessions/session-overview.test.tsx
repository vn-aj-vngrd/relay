import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import type { SessionOverview } from "./overview";
import { SessionAtAGlance } from "./session-overview";

const play: SessionOverview["play"] = {
  activeMatchCount: 0,
  completedMatchCount: 0,
  waitingCount: 0,
  featuredMatch: null,
};

function renderOverview(
  overview: Omit<SessionOverview, "messageCount"> & { messageCount?: number },
  status = "published",
) {
  return render(
    <SessionAtAGlance
      overview={{ ...overview, messageCount: overview.messageCount ?? 0 }}
      hrefBase="/games/session-1"
      status={status}
    />,
  );
}

describe("SessionAtAGlance", () => {
  it("summarizes game activity without replacing the detailed pages", () => {
    renderOverview({ play, payment: { view: "hidden" } });

    expect(screen.getByRole("heading", { name: "Game activity" })).toBeVisible();
    expect(screen.getByText("Not started")).toBeVisible();
    expect(screen.getByText("Players only")).toBeVisible();
    expect(screen.getByRole("link", { name: /^Play.*Not started/ })).toHaveAttribute("href", "/games/session-1/play");
    expect(screen.getByRole("link", { name: /^Chat.*No messages yet/ })).toHaveAttribute(
      "href",
      "/games/session-1/chat",
    );
  });

  it("surfaces the active score and host payment work", () => {
    renderOverview(
      {
        play: {
          activeMatchCount: 2,
          completedMatchCount: 3,
          waitingCount: 4,
          featuredMatch: { courtLabel: "Court 1", teamAScore: 8, teamBScore: 6 },
        },
        messageCount: 12,
        payment: { view: "host", proofCount: 2, unpaidCount: 3 },
      },
      "live",
    );

    expect(screen.getByText("8–6 · Court 1")).toBeVisible();
    expect(screen.getByText("2 active · 4 waiting")).toBeVisible();
    expect(screen.getByText("2 proofs to review")).toBeVisible();
    expect(screen.getByText("12 messages")).toBeVisible();
  });

  it("shows a player the next payment action", () => {
    renderOverview({ play, payment: { view: "player", amountCents: 30000, status: "unpaid", reviewRequested: false } });

    expect(screen.getByText("₱300 due")).toBeVisible();
    expect(screen.getByText("Upload one screenshot after paying")).toBeVisible();
  });

  it("uses final-state roster and conversation copy after completion", () => {
    renderOverview(
      { play: { ...play, completedMatchCount: 2 }, messageCount: 1, payment: { view: "none", canManage: true } },
      "completed",
    );

    expect(screen.getByText("2 matches played")).toBeVisible();
    expect(screen.getByText("Game conversation saved")).toBeVisible();
    expect(screen.getByText("Recap")).toBeVisible();
    expect(screen.queryByText(/going/)).not.toBeInTheDocument();
  });
});
