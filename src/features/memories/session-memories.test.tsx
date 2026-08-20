import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  addMemoryComment: vi.fn(),
  toggleMemoryReaction: vi.fn(),
  uploadMemoryPhoto: vi.fn(),
}));
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

function renderMemories(status: "live" | "completed") {
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
  it("waits for the final session before opening the composer", () => {
    renderMemories("live");
    expect(screen.getByText("This night is still being played.")).toBeVisible();
    expect(screen.queryByRole("button", { name: "Share story" })).not.toBeInTheDocument();
  });

  it("groups story creation, photos, and crew notes after completion", () => {
    renderMemories("completed");
    expect(screen.getByRole("heading", { name: "Share the night" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "Photos from the game" })).toBeVisible();
    expect(screen.getByRole("heading", { name: "From the crew" })).toBeVisible();
    expect(screen.getByRole("button", { name: "Share story" })).toBeEnabled();
  });
});
