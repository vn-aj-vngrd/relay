import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { OverviewRosterPreview } from "./overview-roster-preview";

const base = {
  id: "roster",
  hrefBase: "/s/friends",
  names: ["Alex"],
  imageUrls: [undefined],
  roles: ["cohost"],
  capacity: 8,
  waitlistCount: 2,
};

describe("OverviewRosterPreview", () => {
  it.each(["/s/friends", "/games/game"])(
    "shows final RSVP facts without joining claims on %s",
    (hrefBase) => {
      render(<OverviewRosterPreview {...base} hrefBase={hrefBase} terminal />);
      expect(
        screen.getByRole("heading", { name: "Final roster" })
      ).toBeVisible();
      expect(screen.getByText("1 Going response")).toBeVisible();
      expect(screen.getByText("Co-host")).toBeVisible();
      expect(
        screen.queryByText(/Who played|Waitlist open|spots|Who’s playing/)
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("link", { name: /View all players/ })
      ).toHaveAttribute("href", `${hrefBase}/play?panel=players`);
    }
  );

  it("does not invite someone to an empty ended game", () => {
    render(
      <OverviewRosterPreview
        {...base}
        names={[]}
        imageUrls={[]}
        roles={[]}
        terminal
      />
    );
    expect(screen.getByText("No Going responses were recorded.")).toBeVisible();
    expect(screen.queryByText("Be the first to join.")).not.toBeInTheDocument();
  });

  it("retains the active empty roster invitation", () => {
    render(
      <OverviewRosterPreview {...base} names={[]} imageUrls={[]} roles={[]} />
    );
    expect(
      screen.getByRole("heading", { name: "Who’s playing" })
    ).toBeVisible();
    expect(screen.getByText("Be the first to join.")).toBeVisible();
  });
});
