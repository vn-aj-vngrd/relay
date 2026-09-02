import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeAll, beforeEach, describe, expect, it } from "vitest";

import { PublicQuickPlay } from "./public-quick-play";

beforeAll(() => {
  HTMLDialogElement.prototype.showModal = function showModal() {
    this.setAttribute("open", "");
  };
  HTMLDialogElement.prototype.close = function close() {
    this.removeAttribute("open");
  };
});

beforeEach(() => localStorage.clear());

function nameFourPlayers() {
  ["Van", "AJ", "Mika", "John"].forEach((name, index) => {
    fireEvent.change(screen.getByRole("textbox", { name: `Player ${index + 1}` }), { target: { value: name } });
  });
}

describe("PublicQuickPlay", () => {
  it("prepares manual players, runs a scored match, and records standings", () => {
    render(<PublicQuickPlay />);
    nameFourPlayers();

    fireEvent.click(screen.getByRole("button", { name: "Start Play" }));
    expect(screen.getByRole("heading", { name: "Play" })).toBeVisible();
    expect(screen.getByText("Paddle Stack · scores and rotations stay on this page")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: /Add a point to Van \+ AJ/ }));
    expect(screen.getByLabelText("Van + AJ score 1")).toHaveTextContent("1");
    fireEvent.click(screen.getByRole("button", { name: "Finish match" }));

    expect(screen.getByRole("heading", { name: "Standings" })).toBeVisible();
    expect(within(screen.getByRole("table")).getByText("Van")).toBeVisible();
    expect(screen.getByRole("button", { name: "Start next match" })).toBeVisible();
  });

  it("restores the active session and score after a browser reload", () => {
    const view = render(<PublicQuickPlay />);
    nameFourPlayers();
    fireEvent.click(screen.getByRole("button", { name: "Start Play" }));
    fireEvent.click(screen.getByRole("button", { name: /Add a point to Van \+ AJ/ }));
    expect(localStorage.getItem("relay-quick-play-session")).toContain('"scores":[1,0]');

    view.unmount();
    render(<PublicQuickPlay />);
    expect(screen.getByRole("heading", { name: "Play" })).toBeVisible();
    expect(screen.getByLabelText("Van + AJ score 1")).toHaveTextContent("1");
  });

  it("opens a full-screen scoreboard and switches between active courts", () => {
    render(<PublicQuickPlay />);
    for (let index = 0; index < 4; index += 1) fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    Array.from({ length: 8 }, (_, index) => `Player ${index + 1}`).forEach((name, index) => {
      fireEvent.change(screen.getByRole("textbox", { name: `Player ${index + 1}` }), { target: { value: name } });
    });
    fireEvent.change(screen.getByRole("spinbutton", { name: "Active courts" }), { target: { value: "2" } });
    fireEvent.click(screen.getByRole("button", { name: "Start Play" }));

    fireEvent.click(screen.getAllByRole("button", { name: "Open full-screen scoreboard" })[0]);
    expect(screen.getByRole("dialog", { name: "Court 1 full-screen scoreboard" })).toHaveAttribute("open");
    fireEvent.click(screen.getByRole("button", { name: "Next court, Court 2" }));
    expect(screen.getByRole("dialog", { name: "Court 2 full-screen scoreboard" })).toHaveAttribute("open");
    expect(screen.getByText("Court 2 of 2")).toBeVisible();
  });

  it("validates unique manual player names before starting", () => {
    render(<PublicQuickPlay />);
    ["Van", "Van", "Mika", "John"].forEach((name, index) => {
      fireEvent.change(screen.getByRole("textbox", { name: `Player ${index + 1}` }), { target: { value: name } });
    });
    fireEvent.click(screen.getByRole("button", { name: "Start Play" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Use a different name for each player.");
  });

  it("offers every planned-session Play mode", () => {
    render(<PublicQuickPlay />);

    expect(screen.getByRole("radio", { name: /Paddle Stack/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Mix It Up/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Balanced Mix/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Court Climb/ })).toBeEnabled();
    expect(screen.getByRole("radio", { name: /Team Round Robin/ })).toBeEnabled();
  });

  it("uses Relay listboxes instead of browser-native dropdowns", () => {
    const { container } = render(<PublicQuickPlay />);

    expect(container.querySelector("select")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Queue rule" }));
    fireEvent.click(screen.getByRole("option", { name: "Four rotate — a fresh group every match" }));
    expect(screen.getByRole("button", { name: "Queue rule" })).toHaveTextContent(
      "Four rotate — a fresh group every match",
    );

    fireEvent.click(screen.getByRole("radio", { name: /Balanced Mix/ }));
    expect(screen.getAllByRole("button", { name: "Playing experience" })).toHaveLength(4);
    expect(container.querySelector("select")).not.toBeInTheDocument();
  });

  it("collects playing experience for Balanced Mix", () => {
    render(<PublicQuickPlay />);
    fireEvent.click(screen.getByRole("radio", { name: /Balanced Mix/ }));

    expect(screen.getAllByLabelText("Playing experience")).toHaveLength(4);
    nameFourPlayers();
    fireEvent.click(screen.getByRole("button", { name: "Start Play" }));
    expect(screen.getByText("Balanced Mix · scores and rotations stay on this page")).toBeVisible();
  });

  it("uses a bounded court count and explains the player requirement", () => {
    render(<PublicQuickPlay />);
    const courts = screen.getByRole("spinbutton", { name: "Active courts" });
    expect(courts).toHaveAttribute("min", "1");
    expect(courts).toHaveAttribute("max", "6");
    fireEvent.change(courts, { target: { value: "3" } });
    expect(screen.getByText("Add 8 more players.")).toBeVisible();
    nameFourPlayers();
    fireEvent.click(screen.getByRole("button", { name: "Start Play" }));
    expect(screen.getByRole("alert")).toHaveTextContent("Add 8 more players for 3 courts.");
  });

  it("adds players and lets fixed teams be prepared", () => {
    render(<PublicQuickPlay />);
    fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    fireEvent.click(screen.getByRole("button", { name: "Add player" }));
    expect(screen.getAllByRole("textbox")).toHaveLength(6);

    const partnerStyle = screen.getByRole("group", { name: "Partner style" });
    fireEvent.click(within(partnerStyle).getByRole("radio", { name: /Keep pairs together/ }));
    expect(screen.getByRole("heading", { name: "Set the pairs" })).toBeVisible();
    expect(screen.getByLabelText("Pair 3, player 2")).toBeVisible();
  });
});
