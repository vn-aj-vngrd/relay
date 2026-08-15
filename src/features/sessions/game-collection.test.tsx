import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, it } from "vitest";
import { GameCollection, type GameCollectionItem } from "./game-collection";

const game: GameCollectionItem = {
  id: "game-1",
  href: "/games/game-1",
  title: "Saturday Night Pickle",
  date: "AUG 22",
  time: "7:00–9:00 PM",
  venue: "Central Pickle",
  playerCount: 8,
  capacity: 10,
};

afterEach(() => {
  cleanup();
  localStorage.clear();
});

describe("GameCollection", () => {
  it("persists the chosen grid or list presentation", () => {
    const { unmount } = render(<GameCollection upcoming={[game]} past={[]} />);
    expect(screen.getByTestId("games-list")).toBeVisible();

    fireEvent.click(screen.getByRole("button", { name: "Grid view" }));
    expect(screen.getByTestId("games-grid")).toBeVisible();
    expect(localStorage.getItem("relay-games-view")).toBe("grid");

    unmount();
    render(<GameCollection upcoming={[game]} past={[]} />);
    expect(screen.getByTestId("games-grid")).toBeVisible();
  });
});
