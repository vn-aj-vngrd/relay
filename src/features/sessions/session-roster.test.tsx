import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { SessionRoster } from "./session-roster";

vi.mock("./player-roster-controls", () => ({
  AddPlayerForm: () => <button type="button">Invite or add player</button>,
  PendingPlayerActions: () => <button type="button">Approve player</button>,
  RemovePlayerButton: () => <button type="button">Remove player</button>,
  RosterLockButton: () => <button type="button">Lock roster</button>,
}));
vi.mock("./attendance-toggle", () => ({
  AttendanceToggle: ({ name }: { name: string }) => (
    <button type="button">Check in {name}</button>
  ),
}));

function data(status = "published") {
  return {
    session: { id: "session", capacity: 8, status, rosterLocked: false },
    roster: [
      ["Host player", "going", "host"],
      ["Guest player", "going", "player"],
      ["First waitlisted", "waitlisted", "cohost"],
      ["Second waitlisted", "waitlisted", "player"],
      ["Private request", "pending", "player"],
      ["Private invitation", "invited", "player"],
      ["Private maybe", "maybe", "player"],
      ["Private decline", "declined", "player"],
    ].map(([name, rsvp, role]) => ({
      player: {
        id: name,
        guestName: name,
        rsvp,
        role,
        checkedInAt: null,
        skillLevel: null,
        leftAt: null,
      },
      profile: null,
    })),
  } as unknown as Parameters<typeof SessionRoster>[0]["data"];
}

describe("shared server-rendered roster", () => {
  it("preserves organizer roster groups, indicators, waitlist order and arrival controls", () => {
    render(<SessionRoster data={data()} canManage />);
    for (const label of [
      "Going",
      "Waitlist",
      "Join requests",
      "Other responses",
    ]) {
      expect(screen.getByRole("heading", { name: label })).toBeVisible();
    }
    expect(
      screen.getByRole("button", { name: "Invite or add player" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Approve player" })
    ).toBeVisible();
    expect(
      screen.getByRole("button", { name: "Check in Guest player" })
    ).toBeVisible();
    expect(screen.getByText("Host", { exact: true })).toBeVisible();
    expect(screen.getByText("Co-host", { exact: true })).toBeVisible();
    expect(screen.getAllByRole("list")[2]).toHaveTextContent(
      /First waitlisted.*Second waitlisted/
    );
  });

  it("omits private rows and management controls from unauthorized rendered output, not just visibility", () => {
    const { container } = render(
      <SessionRoster
        data={data()}
        canManage={false}
        viewerPlayerId="Guest player"
      />
    );
    expect(container.textContent).not.toContain("Private");
    expect(
      screen.queryByRole("button", { name: "Invite or add player" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Approve player" })
    ).not.toBeInTheDocument();
    expect(
      screen.queryByRole("button", { name: "Remove player" })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Check in Guest player" })
    ).toBeVisible();
    expect(
      screen.queryByRole("button", { name: "Check in Host player" })
    ).not.toBeInTheDocument();
  });

  it.each(["completed", "cancelled"])(
    "renders %s read-only without claiming RSVP proves participation",
    (status) => {
      render(<SessionRoster data={data(status)} canManage />);
      expect(screen.queryByRole("button")).not.toBeInTheDocument();
      expect(
        screen.getByText(/RSVP does not establish court participation/)
      ).toBeVisible();
      expect(screen.queryByText(/spots filled/)).not.toBeInTheDocument();
      expect(screen.getByText("Private invitation")).toBeVisible();
    }
  );

  it("keeps anonymous shared viewers read-only", () => {
    render(<SessionRoster data={data()} canManage={false} />);
    expect(screen.queryByRole("button")).not.toBeInTheDocument();
  });

  it("never repeats pre-play arrival controls during live play", () => {
    render(
      <SessionRoster
        data={data("live")}
        canManage
        viewerPlayerId="Guest player"
      />
    );
    expect(
      screen.queryByRole("button", { name: /Check in/ })
    ).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Invite or add player" })
    ).toBeVisible();
  });
});
