import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  uploadMemoryPhotoState: vi.fn(async () => ({})),
}));
vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: vi.fn(),
}));

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

function renderMemories(
  status: "draft" | "published" | "live" | "completed" | "cancelled",
  visibility: "public" | "link" | "private" = "link"
) {
  return render(
    <SessionMemories
      session={{
        id: "session",
        title: "Saturday Night Pickle",
        venueName: "Central Pickle",
        startsAt: new Date("2026-08-19T10:00:00Z"),
        endsAt: new Date("2026-08-19T12:00:00Z"),
        timezone: "Asia/Manila",
        accentColor: "violet",
        status,
        slug: "saturday-night",
        visibility,
        playerPriceCents: 35000,
        capacity: 8,
        courtCount: 2,
        requiresApproval: true,
      }}
      recap={buildSessionRecap([match], players)}
      memory={null}
      canContribute={false}
      viewerPlayerId="a"
      goingCount={6}
      hostName="Van"
      storyAsOf="8:42 PM"
    />
  );
}

describe("SessionMemories", () => {
  it("makes a scheduled invitation with truthful plan and roster facts", () => {
    renderMemories("published");
    expect(
      screen.getByRole("heading", { name: "Invite the crew" })
    ).toBeVisible();
    expect(screen.getByText("₱350")).toBeVisible();
    expect(screen.getByText("6/8")).toBeVisible();
    expect(screen.getByText("Hosted by Van")).toBeVisible();
    expect(
      screen.getByText("2 spots open · Host approval required")
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Share invitation" })
    ).toBeEnabled();
    expect(screen.getByRole("button", { name: "Copy link" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Photos" })
    ).not.toBeInTheDocument();
  });

  it("gives draft and cancelled games truthful non-sharing states", () => {
    const { rerender } = renderMemories("draft");
    expect(
      screen.getByRole("heading", {
        name: "Publish the game to make its invitation",
      })
    ).toBeVisible();

    rerender(
      <SessionMemories
        session={{
          id: "session",
          title: "Saturday Night Pickle",
          venueName: "Central Pickle",
          startsAt: new Date("2026-08-19T10:00:00Z"),
          endsAt: new Date("2026-08-19T12:00:00Z"),
          timezone: "Asia/Manila",
          accentColor: "violet",
          status: "cancelled",
          slug: "saturday-night",
          visibility: "link",
          playerPriceCents: 35000,
          capacity: 8,
          courtCount: 2,
          requiresApproval: true,
        }}
        recap={buildSessionRecap([match], players)}
        memory={null}
        canContribute={false}
        viewerPlayerId="a"
        goingCount={6}
        hostName="Van"
        storyAsOf="8:42 PM"
      />
    );
    expect(
      screen.getByRole("heading", { name: "This game was cancelled" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: /Share/ })
    ).not.toBeInTheDocument();
  });

  it("keeps link and QR actions out of private games", () => {
    renderMemories("published", "private");
    expect(
      screen.queryByRole("button", { name: "Copy link" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Show QR" })
    ).not.toBeInTheDocument();
  });

  it("makes a live update using only safe aggregate facts", () => {
    renderMemories("live");
    expect(
      screen.getByRole("heading", { name: "Share what’s happening" })
    ).toBeVisible();
    expect(screen.getByText("completed matches")).toBeVisible();
    expect(screen.getByText("2")).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Share live update" })
    ).toBeEnabled();
    expect(screen.queryByText("Van")).not.toBeInTheDocument();
    expect(screen.queryByText("₱350")).not.toBeInTheDocument();
  });

  it("shows story creation and photos after completion", () => {
    renderMemories("completed");
    expect(
      screen.getByRole("heading", { name: "Share the game" })
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Make" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    expect(
      screen.queryByRole("heading", { name: "Photos from the game" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Photos, 0" }));
    expect(
      screen.getByRole("heading", { name: "Photos from the game" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Share story" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Make" }));
    expect(screen.getByRole("button", { name: "Share story" })).toBeEnabled();
  });
});
