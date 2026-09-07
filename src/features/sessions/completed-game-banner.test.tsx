import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CompletedGameBanner, paymentAction } from "./completed-game-banner";
import type { SessionOverview } from "./overview";

const base = { sessionId: "game", hrefBase: "/games/game" };

describe("CompletedGameBanner", () => {
  it("offers only recap by default without invented results or dismissal", () => {
    render(<CompletedGameBanner {...base} />);
    expect(screen.getByRole("heading", { name: "Game ended" })).toBeVisible();
    expect(screen.getAllByRole("link")).toHaveLength(1);
    expect(screen.getByRole("link", { name: "View recap" })).toHaveAttribute(
      "href",
      "/games/game/play"
    );
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
    expect(
      screen.queryByText(/Results are saved|winner|you played/i)
    ).not.toBeInTheDocument();
  });

  it("keeps authorized link viewers on the shared route", () => {
    render(<CompletedGameBanner {...base} hrefBase="/s/friends" canBrowse />);
    expect(screen.getByRole("link", { name: "View recap" })).toHaveAttribute(
      "href",
      "/s/friends/play"
    );
    expect(
      screen.getByRole("link", { name: "Browse open games" })
    ).toHaveAttribute("href", "/games/open");
    expect(
      screen.queryByRole("link", { name: /payment|Play again/i })
    ).not.toBeInTheDocument();
  });

  it("offers replay only when the route grants original-host capability", () => {
    render(<CompletedGameBanner {...base} hrefBase="/s/friends" canReplay />);
    expect(screen.getByRole("link", { name: "Play again" })).toHaveAttribute(
      "href",
      "/games/new?from=game"
    );
    expect(
      screen.queryByRole("link", { name: "Browse open games" })
    ).not.toBeInTheDocument();
  });

  it.each(["/s/friends", "/games/game"])(
    "keeps authorized payment follow-up under %s",
    (hrefBase) => {
      render(
        <CompletedGameBanner
          {...base}
          hrefBase={hrefBase}
          payment={{
            view: "player",
            status: "unpaid",
            amountCents: 29900,
            reviewRequested: false,
          }}
        />
      );
      expect(
        screen.getByRole("link", { name: "View payment · ₱299 due" })
      ).toHaveAttribute("href", `${hrefBase}/payments`);
    }
  );

  it.each<SessionOverview["payment"]>([
    { view: "hidden" },
    { view: "none", canManage: false },
    { view: "host", unpaidCount: 2, proofCount: 1 },
    {
      view: "player",
      status: "confirmed",
      amountCents: 29900,
      reviewRequested: false,
    },
    {
      view: "player",
      status: "excluded",
      amountCents: 29900,
      reviewRequested: false,
    },
  ])("does not invent a payment action for $view", (payment) => {
    expect(paymentAction(payment)).toBeNull();
  });

  it("preserves sent-proof and correction wording", () => {
    const payment = {
      view: "player",
      status: "sent",
      amountCents: 29900,
      reviewRequested: false,
    } as const;
    expect(paymentAction(payment)).toBe("View payment · Proof sent");
    expect(paymentAction({ ...payment, reviewRequested: true })).toBe(
      "Upload new proof · ₱299"
    );
  });
});
