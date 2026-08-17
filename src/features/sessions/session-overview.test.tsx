import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionAtAGlance } from "./session-overview";
import type { SessionOverview } from "./overview";

const play: SessionOverview["play"] = {
  activeMatchCount: 0,
  completedMatchCount: 0,
  waitingCount: 0,
  featuredMatch: null,
};

function renderOverview(overview: SessionOverview, status = "published") {
  return render(<SessionAtAGlance overview={overview} hrefBase="/games/session-1" status={status} goingCount={8} capacity={10} waitlistCount={2} pendingCount={1} />);
}

describe("SessionAtAGlance", () => {
  it("summarizes roster, play, and payment without replacing their detailed pages", () => {
    renderOverview({ play, payment: { view: "hidden" } });

    expect(screen.getByText("8 of 10 going")).toBeVisible();
    expect(screen.getByText("2 waitlisted · 1 to approve")).toBeVisible();
    expect(screen.getByText("Not started")).toBeVisible();
    expect(screen.getByText("Players only")).toBeVisible();
    expect(screen.getByRole("link", { name: /^PlayNot started/ })).toHaveAttribute("href", "/games/session-1/play");
  });

  it("surfaces the active score and host payment work", () => {
    renderOverview({
      play: { activeMatchCount: 2, completedMatchCount: 3, waitingCount: 4, featuredMatch: { courtLabel: "Court 1", teamAScore: 8, teamBScore: 6 } },
      payment: { view: "host", proofCount: 2, unpaidCount: 3 },
    }, "live");

    expect(screen.getByText("8–6 · Court 1")).toBeVisible();
    expect(screen.getByText("2 active · 4 waiting")).toBeVisible();
    expect(screen.getByText("2 proofs to review")).toBeVisible();
  });

  it("shows a player the next payment action", () => {
    renderOverview({ play, payment: { view: "player", amountCents: 30000, status: "unpaid", reviewRequested: false } });

    expect(screen.getByText("₱300 due")).toBeVisible();
    expect(screen.getByText("Upload one screenshot after paying")).toBeVisible();
  });
});
