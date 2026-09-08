import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { SessionListingStatus } from "./session-listing-status";

const now = new Date("2030-01-01T10:00:00Z");
const session = {
  id: "game",
  slug: "game-link",
  visibility: "public",
  status: "published",
  endsAt: new Date("2030-01-01T11:00:00Z"),
  playerPriceCents: 0 as number | null,
};

describe("host listing status", () => {
  it.each(["public", "link", "private"])(
    "offers collection setup for %s intent without claiming a price",
    (visibility) => {
      render(
        <SessionListingStatus
          session={{
            ...session,
            visibility,
            playerPriceCents: null,
            paymentCollectionRequested: true,
          }}
          hasExpense={false}
          isOriginalHost
          now={now}
        />
      );
      expect(
        screen.getByRole("link", { name: "Set up payment" })
      ).toHaveAttribute(
        "href",
        "/games/game/settings?section=payments#player-payment"
      );
      expect(
        screen.queryByText("Listed in Open games")
      ).not.toBeInTheDocument();
    }
  );
  it.each(["public", "link", "private"])(
    "does not expose original-host setup to other viewers of a %s game",
    (visibility) => {
      render(
        <SessionListingStatus
          session={{
            ...session,
            visibility,
            playerPriceCents: null,
            paymentCollectionRequested: true,
          }}
          hasExpense={false}
          isOriginalHost={false}
          now={now}
        />
      );
      expect(
        screen.queryByRole("link", { name: "Set up payment" })
      ).not.toBeInTheDocument();
    }
  );
  it("removes setup once a collection exists even before split shares exist", () => {
    render(
      <SessionListingStatus
        session={{
          ...session,
          playerPriceCents: null,
          paymentCollectionRequested: true,
        }}
        hasExpense
        isOriginalHost
        now={now}
      />
    );
    expect(
      screen.queryByRole("link", { name: "Set up payment" })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Player share pending/)).toBeVisible();
  });
  it.each(["completed", "cancelled"])(
    "does not prompt new setup for a %s game",
    (status) => {
      render(
        <SessionListingStatus
          session={{
            ...session,
            status,
            playerPriceCents: null,
            paymentCollectionRequested: true,
          }}
          hasExpense={false}
          isOriginalHost
          now={now}
        />
      );
      expect(screen.queryByRole("link")).not.toBeInTheDocument();
    }
  );
  it("shows the actual listing and canonical shared preview", () => {
    render(
      <SessionListingStatus
        session={session}
        hasExpense={false}
        isOriginalHost
        now={now}
      />
    );
    expect(screen.getByText("Listed in Open games")).toBeVisible();
    expect(screen.getByRole("link", { name: "View listing" })).toHaveAttribute(
      "href",
      "/s/game-link?source=open-games"
    );
  });
  it("names a missing price and links directly to its owner", () => {
    render(
      <SessionListingStatus
        session={{ ...session, playerPriceCents: null }}
        hasExpense={false}
        isOriginalHost
        now={now}
      />
    );
    expect(screen.getByText("Not listed in Open games")).toBeVisible();
    expect(screen.getByText(/Price not set/)).toBeVisible();
    expect(
      screen.getByRole("link", { name: "Set player payment" })
    ).toHaveAttribute(
      "href",
      "/games/game/settings?section=payments#player-payment"
    );
    expect(screen.queryByText(/100%/)).not.toBeInTheDocument();
  });
  it("does not offer a co-host an original-host-only correction", () => {
    render(
      <SessionListingStatus
        session={{ ...session, playerPriceCents: null }}
        hasExpense
        isOriginalHost={false}
        now={now}
      />
    );
    expect(screen.getByText(/Player share pending/)).toBeVisible();
    expect(
      screen.queryByRole("link", { name: "Payment settings" })
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Only the original host/)).toBeVisible();
  });
  it.each([
    ["private", "Invite only"],
    ["link", "Anyone with link"],
  ])("shows %s access without a checklist", (visibility, label) => {
    render(
      <SessionListingStatus
        session={{ ...session, visibility, playerPriceCents: null }}
        hasExpense={false}
        isOriginalHost
        now={now}
      />
    );
    expect(screen.getByText(label)).toBeVisible();
    expect(
      screen.queryByText("Not listed in Open games")
    ).not.toBeInTheDocument();
  });
  it("reports completed games without impossible corrective actions", () => {
    render(
      <SessionListingStatus
        session={{ ...session, status: "completed", playerPriceCents: null }}
        hasExpense
        isOriginalHost
        now={now}
      />
    );
    expect(screen.getByText("Game ended.")).toBeVisible();
    expect(screen.queryByRole("link")).not.toBeInTheDocument();
  });
});
