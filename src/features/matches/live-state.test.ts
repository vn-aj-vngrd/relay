import { describe, expect, it } from "vitest";

import { deriveLiveState } from "./live-state";

const queued = (id: string, position: number, state = "waiting") => ({
  queue: { state, position },
  player: { id, guestName: id },
});

describe("live session state", () => {
  it("orders complete waiting pairs by their earliest queue position", () => {
    const state = deriveLiveState({
      rotationMode: "queue",
      queue: [
        queued("c", 1),
        queued("a", 2),
        queued("d", 3),
        queued("b", 4),
        queued("away", 5, "playing"),
      ],
      pairs: [
        { id: "pair-a", position: 1, members: ["a", "b"] },
        { id: "pair-c", position: 2, members: ["c", "d"] },
        { id: "incomplete", position: 3, members: ["away", "a"] },
      ],
      activeMatches: [],
      courtCount: 2,
      completedMatchCount: 0,
    });

    expect(state.waitingPairs.map((pair) => pair.id)).toEqual([
      "pair-c",
      "pair-a",
    ]);
    expect(state.canStartRotation).toBe(true);
    expect(state.rotationLabel).toBe("Start first match");
  });

  it("does not offer a match when four waiting players form fewer than two complete pairs", () => {
    const state = deriveLiveState({
      rotationMode: "queue",
      queue: [queued("a", 1), queued("c", 2), queued("e", 3), queued("g", 4)],
      pairs: [
        { id: "one", position: 1, members: ["a", "b"] },
        { id: "two", position: 2, members: ["c", "d"] },
        { id: "three", position: 3, members: ["e", "f"] },
        { id: "four", position: 4, members: ["g", "h"] },
      ],
      activeMatches: [],
      courtCount: 2,
      completedMatchCount: 0,
    });

    expect(state.waitingPairs).toHaveLength(0);
    expect(state.canStartRotation).toBe(false);
    expect(state.nextCourtCount).toBe(0);
  });

  it("waits for the active synchronized round to finish", () => {
    const state = deriveLiveState({
      rotationMode: "balanced",
      queue: [queued("a", 1), queued("b", 2), queued("c", 3), queued("d", 4)],
      pairs: [],
      activeMatches: [{ startedAt: new Date("2030-01-01T10:05:00Z") }],
      courtCount: 2,
      completedMatchCount: 1,
    });

    expect(state.roundMode).toBe(true);
    expect(state.canStartRotation).toBe(false);
    expect(state.roundStartedAt).toEqual(new Date("2030-01-01T10:05:00Z"));
    expect(state.rotationLabel).toBe("Start next round");
  });

  it("stops Team Round Robin after every pair has met", () => {
    const state = deriveLiveState({
      rotationMode: "round_robin",
      queue: [queued("a", 1), queued("b", 2), queued("c", 3), queued("d", 4)],
      pairs: [
        { id: "one", position: 1, members: ["a", "b"] },
        { id: "two", position: 2, members: ["c", "d"] },
      ],
      activeMatches: [],
      courtCount: 1,
      completedMatchCount: 1,
    });

    expect(state.roundRobinComplete).toBe(true);
    expect(state.canStartRotation).toBe(false);
  });
});
