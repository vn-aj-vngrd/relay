import { fireEvent, render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("./actions", () => ({
  uploadMemoryPhotoState: vi.fn(async () => ({})),
}));
vi.mock("@/features/analytics/actions", () => ({
  trackSharedSessionEvent: vi.fn(),
}));

import type { PlayerPriceInput } from "@/features/sessions/player-price";
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
  visibility: "public" | "link" | "private" = "link",
  price?: PlayerPriceInput,
  permission = { canContribute: false, uploadsDisabled: false }
) {
  return render(
    <SessionMemories
      price={price}
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
      canContribute={permission.canContribute}
      uploadsDisabled={permission.uploadsDisabled}
      viewerPlayerId="a"
      goingCount={6}
      hostName="Van"
      storyAsOf="8:42 PM"
    />
  );
}

describe("SessionMemories", () => {
  it("explains host-disabled photos without removing story access", () => {
    renderMemories("completed", "link", undefined, {
      canContribute: true,
      uploadsDisabled: true,
    });
    fireEvent.click(screen.getByRole("button", { name: "Photos, 0" }));
    expect(
      screen.getByText(/host has turned off participant photo uploads/)
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Add to memory" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Make" }));
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();
  });
  it.each([
    [{ playerPriceCents: null, hasExpense: false }, "Price not set"],
    [{ playerPriceCents: null, hasExpense: true }, "Player share pending"],
    [{ playerPriceCents: 0, hasExpense: false }, "Free"],
    [
      { playerPriceCents: 12525, hasExpense: true, priceIsFixed: true },
      "₱125.25 per player",
    ],
    [
      { playerPriceCents: 12525, hasExpense: true, priceIsFixed: false },
      "₱125.25 per player · Current player share",
    ],
  ] as const)(
    "uses current shared pricing facts in the invitation: %j",
    (price, label) => {
      renderMemories("published", "link", price);
      expect(
        screen.getByText((_, element) => {
          if (element?.tagName.toLowerCase() !== "text") return false;
          const lines = Array.from(element.querySelectorAll("tspan"));
          return (
            (lines.length
              ? lines.map((line) => line.textContent?.trim()).join(" ")
              : element.textContent) === label
          );
        })
      ).toBeVisible();
      if (label !== "Price not set")
        expect(screen.queryByText("Price not set")).not.toBeInTheDocument();
      expect(screen.queryByText("Free · per player")).not.toBeInTheDocument();
      expect(
        screen.queryByText("Player share pending · per player")
      ).not.toBeInTheDocument();
    }
  );
  it("makes a scheduled invitation with truthful plan and roster facts", () => {
    renderMemories("published");
    expect(screen.queryByText("Invite the crew")).not.toBeInTheDocument();
    expect(
      screen.queryByText(
        "Turn the current plan, price, and roster availability into a clear invitation."
      )
    ).not.toBeInTheDocument();
    expect(screen.getByText("Wed, Aug 19 · 6:00 PM–8:00 PM")).toBeVisible();
    expect(screen.getByText("₱350 per player")).toBeVisible();
    expect(screen.getByText("6/8 Going")).toBeVisible();
    expect(screen.getByText("Hosted by Van")).toBeVisible();
    expect(
      screen.getByText("2 spots open · Host approval required")
    ).toBeVisible();
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();
    expect(
      screen.queryByRole("button", { name: "Copy link" })
    ).not.toBeInTheDocument();
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
      screen.getByRole("region", { name: "Create a story" })
    ).toBeVisible();
    expect(screen.getByText("1 completed match")).toBeVisible();
    expect(screen.getByText("2 planned courts")).toBeVisible();
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();
    expect(screen.queryByText("Van")).not.toBeInTheDocument();
    expect(screen.queryByText("₱350")).not.toBeInTheDocument();
  });

  it("shows story creation and photos after completion", () => {
    renderMemories("completed");
    expect(
      screen.getByRole("region", { name: "Create a story" })
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
      screen.queryByRole("button", { name: "Share Story" })
    ).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Make" }));
    expect(screen.getByRole("button", { name: "Share Story" })).toBeEnabled();
  });
});
