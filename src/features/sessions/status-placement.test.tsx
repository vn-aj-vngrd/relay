import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import type { GameCollectionItem } from "./game-collection-types";
import { GameInvitationCard } from "./game-invitation-card";
import { InvitationHistoryItems } from "./invitation-history-items";

vi.mock("./actions", () => ({ rsvpAction: vi.fn() }));
afterEach(cleanup);

const game: GameCollectionItem = {
  id: "placement-game",
  href: "/games/placement-game",
  title:
    "A very long Friday pickleball invitation for the entire neighborhood crew",
  date: "SEP 10",
  dateKey: "2099-09-10",
  endsAt: "2099-09-10T10:00:00Z",
  time: "3–6 PM",
  venue: "Central",
  playerCount: 4,
  capacity: 16,
  status: "live",
  accentColor: "coral",
  viewerRsvp: "invited",
  invitedAt: "2099-09-01T00:00:00Z",
  hostName: "Mika",
  playerPriceCents: 0,
  requiresApproval: false,
  spotsRemaining: 12,
  canReplay: false,
};

describe("Invitation lifecycle placement", () => {
  it("groups compact invitation titles and chips without expanding the title", () => {
    render(
      <GameInvitationCard
        game={game}
        source="games"
        compact
        onResponded={vi.fn()}
      />
    );
    const title = screen.getByRole("link", { name: game.title });
    const chip = screen.getByText("Live");
    expect(title.parentElement).toBe(chip.parentElement);
    expect(title.parentElement).toHaveClass("flex", "gap-2", "min-w-0");
    expect(title).toHaveClass("truncate", "min-w-0");
    expect(title).not.toHaveClass("flex-1");
    expect(chip).toHaveClass("shrink-0");
  });

  it.each(["home", "games"] as const)(
    "keeps %s invitation card status with date, not title",
    (source) => {
      render(
        <GameInvitationCard game={game} source={source} onResponded={vi.fn()} />
      );
      const chip = screen.getByText("Live");
      expect(chip.parentElement).toContainElement(screen.getByText(game.date));
      expect(chip.parentElement).not.toContainElement(
        screen.getByRole("link", { name: game.title })
      );
      expect(screen.getAllByText("Live")).toHaveLength(1);
    }
  );

  it.each(["list", "grid"] as const)(
    "keeps answered invitation %s status separate from RSVP",
    (mode) => {
      render(
        <InvitationHistoryItems
          items={[{ ...game, status: "completed", viewerRsvp: "going" }]}
          mode={mode}
          onResponded={vi.fn()}
        />
      );
      const chip = screen.getByText("Ended");
      const title = screen.getByRole("heading", { name: game.title });
      if (mode === "list") {
        expect(title.parentElement).toBe(chip.parentElement);
        expect(title).toHaveClass("truncate");
      } else {
        expect(chip.parentElement?.querySelector("time")).toHaveTextContent(
          game.date
        );
        expect(chip.parentElement).not.toContainElement(title);
      }
      expect(chip.parentElement).not.toContainElement(
        screen.getByText("Going")
      );
      expect(screen.getAllByText("Ended")).toHaveLength(1);
      expect(screen.getByRole("link", { name: "View recap" })).toHaveAttribute(
        "href",
        `${game.href}/play`
      );
    }
  );
});
