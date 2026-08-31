import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { PublicQuickPlay } from "./public-quick-play";

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

  it("collects playing experience for Balanced Mix", () => {
    render(<PublicQuickPlay />);
    fireEvent.click(screen.getByRole("radio", { name: /Balanced Mix/ }));

    expect(screen.getAllByLabelText("Playing experience")).toHaveLength(4);
    nameFourPlayers();
    fireEvent.click(screen.getByRole("button", { name: "Start Play" }));
    expect(screen.getByText("Balanced Mix · scores and rotations stay on this page")).toBeVisible();
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
