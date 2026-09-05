import { describe, expect, it } from "vitest";

import { moveQueueGroup, restoreCancelledPlayers } from "./lifecycle";

describe("moveQueueGroup", () => {
  it("moves a fixed pair together", () => {
    expect(moveQueueGroup(["a", "b", "c", "d"], ["c", "d"], "top")).toEqual([
      "c",
      "d",
      "a",
      "b",
    ]);
  });

  it("moves a player down one place", () => {
    expect(moveQueueGroup(["a", "b", "c"], ["a"], "down")).toEqual([
      "b",
      "a",
      "c",
    ]);
  });

  it("moves pairs by one complete pair without splitting neighbors", () => {
    expect(
      moveQueueGroup(["a", "b", "c", "d", "e", "f"], ["a", "b"], "down")
    ).toEqual(["c", "d", "a", "b", "e", "f"]);
    expect(
      moveQueueGroup(["a", "b", "c", "d", "e", "f"], ["c", "d"], "up")
    ).toEqual(["c", "d", "a", "b", "e", "f"]);
  });
});

describe("restoreCancelledPlayers", () => {
  it("restores a cancelled group without rolling back newer waiting order", () => {
    expect(
      restoreCancelledPlayers(
        [
          { id: "new-first", position: 1 },
          { id: "later", position: 8 },
        ],
        [
          { id: "cancelled-a", position: 4 },
          { id: "cancelled-b", position: 5 },
        ]
      )
    ).toEqual([
      { id: "new-first", position: 1 },
      { id: "cancelled-a", position: 2 },
      { id: "cancelled-b", position: 3 },
      { id: "later", position: 4 },
    ]);
  });
});
