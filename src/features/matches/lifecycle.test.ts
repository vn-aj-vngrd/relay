import { describe, expect, it } from "vitest";

import {
  derivePersonalPlayState,
  moveQueueGroup,
  restoreCancelledPlayers,
} from "./lifecycle";

const waiting = (ids: string[]) =>
  ids.map((playerId, index) => ({
    playerId,
    position: index + 1,
    state: "waiting",
  }));

describe("derivePersonalPlayState", () => {
  it("prioritizes an active assignment over stale availability", () => {
    expect(
      derivePersonalPlayState({
        playerId: "me",
        rsvp: "going",
        checkedInAt: new Date(),
        playState: "resting",
        queue: [{ playerId: "me", position: 1, state: "playing" }],
        pairs: [],
        activeMatches: [
          {
            id: "match-1",
            courtLabel: "Court 2",
            players: [
              { id: "me", name: "Me", team: "A" },
              { id: "partner", name: "Ana", team: "A" },
              { id: "one", name: "Marco", team: "B" },
              { id: "two", name: "Luis", team: "B" },
            ],
          },
        ],
      })
    ).toEqual({
      kind: "playing",
      matchId: "match-1",
      courtLabel: "Court 2",
      partnerNames: ["Ana"],
      opponentNames: ["Marco", "Luis"],
    });
  });

  it("marks the first four individual players as likely next", () => {
    expect(
      derivePersonalPlayState({
        playerId: "d",
        rsvp: "going",
        checkedInAt: new Date(),
        playState: "waiting",
        queue: waiting(["a", "b", "c", "d", "e"]),
        pairs: [],
        activeMatches: [],
      })
    ).toMatchObject({ kind: "waiting", position: 4, ready: true });
  });

  it("uses pair position for fixed partners", () => {
    expect(
      derivePersonalPlayState({
        playerId: "c",
        rsvp: "going",
        checkedInAt: new Date(),
        playState: "waiting",
        queue: waiting(["a", "b", "c", "d"]),
        pairs: [
          { id: "first", members: ["a", "b"] },
          { id: "second", members: ["c", "d"] },
        ],
        activeMatches: [],
      })
    ).toMatchObject({
      kind: "waiting",
      position: 2,
      groupsAhead: 0,
      ready: true,
      fixedPair: true,
    });
  });
});

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
