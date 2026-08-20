import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  addMemoryComment: vi.fn(),
  toggleMemoryReaction: vi.fn(),
  uploadMemoryPhoto: vi.fn(),
}));

import { buildSessionRecap, type RecapMatch } from "./recap";
import { SessionRecap } from "./session-recap";

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

function renderRecap(status: "published" | "live" | "completed", matches: RecapMatch[]) {
  return render(
    <SessionRecap
      session={{
        id: "session",
        title: "Saturday Night Pickle",
        venueName: "Central Pickle",
        startsAt: new Date("2026-08-19T10:00:00Z"),
        status,
      }}
      recap={buildSessionRecap(matches, players)}
      storyHref="/games/session/story"
    />,
  );
}

describe("SessionRecap states", () => {
  it("sets expectations before the first match", () => {
    renderRecap("published", []);

    expect(screen.getByText("Recap preview")).toBeInTheDocument();
    expect(screen.getByText("Waiting for the first result")).toBeInTheDocument();
    expect(screen.getByText("No completed matches yet")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share story" })).not.toBeInTheDocument();
  });

  it("shows provisional facts while play is underway", () => {
    renderRecap("live", [match]);

    expect(screen.getByText("Recap in progress")).toBeInTheDocument();
    expect(screen.getByText("Building as you play")).toBeInTheDocument();
    expect(screen.getByText(/1 completed match is included so far/)).toBeInTheDocument();
    expect(screen.getByText("Highlights so far")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share story" })).not.toBeInTheDocument();
  });

  it("keeps completed results factual and links to Story", () => {
    renderRecap("completed", [match]);

    expect(screen.getByText("Final recap")).toBeInTheDocument();
    expect(screen.getByText("Session highlights")).toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Share story" })).not.toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Open story/ })).toHaveAttribute("href", "/games/session/story");
  });
});
