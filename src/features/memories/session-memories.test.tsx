import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({ uploadMemoryPhotoState: vi.fn(async () => ({})) }));
vi.mock("@/features/analytics/actions", () => ({ trackSharedSessionEvent: vi.fn() }));

import { buildSessionRecap, type RecapMatch } from "./recap";
import { SessionMemories } from "./session-memories";

const players = [
  { id: "a", name: "Van" },
  { id: "b", name: "AJ" },
  { id: "c", name: "Mika" },
  { id: "d", name: "Bea" },
];
const match: RecapMatch = {
  id: "match",
  courtLabel: "Court 1",
  teamA: ["a", "b"],
  teamB: ["c", "d"],
  scoreA: 11,
  scoreB: 8,
  status: "completed",
  startedAt: new Date("2026-08-19T10:00:00Z"),
  finishedAt: new Date("2026-08-19T10:12:00Z"),
};

function renderMemories(status: "published" | "live" | "completed") {
  return render(
    <SessionMemories
      session={{
        id: "session",
        title: "Saturday Night Pickle",
        venueName: "Central Pickle",
        startsAt: new Date("2026-08-19T10:00:00Z"),
        accentColor: "violet",
        status,
      }}
      recap={buildSessionRecap([match], players)}
      memory={null}
      canContribute={false}
      viewerPlayerId="a"
    />,
  );
}

describe("SessionMemories", () => {
  it("describes a scheduled game without implying that play has started", () => {
    renderMemories("published");
    expect(screen.getByRole("heading", { name: "Story unlocks when the game ends." })).toBeVisible();
    expect(screen.getByText(/Once play is complete/)).toBeVisible();
  });

  it("describes live play without assuming a time of day", () => {
    renderMemories("live");
    expect(screen.getByText("This game is still being played.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Share story" })).not.toBeInTheDocument();
  });

  it("shows story creation and photos after completion", () => {
    renderMemories("completed");
    expect(screen.getByRole("heading", { name: "Share the game" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Photos from the game" })).toBeVisible();
    expect(screen.queryByRole("heading", { name: "From the crew" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Share story" })).toBeEnabled();
  });
});
